#!/bin/sh

# 迁移旧数据
if [ -d '/tmp/vertex' ]; then
  rm -rf /vertex/*
  mv /tmp/vertex/* /vertex
  rm -rf /tmp/vertex
fi

# 创建所有必要目录
mkdir -p /vertex/data/rss \
         /vertex/data/client \
         /vertex/data/server \
         /vertex/data/rule/delete \
         /vertex/data/rule/rss \
         /vertex/data/rule/race \
         /vertex/data/rule/raceSet \
         /vertex/data/rule/link \
         /vertex/data/push \
         /vertex/data/script \
         /vertex/data/watch/set \
         /vertex/data/site \
         /vertex/data/race \
         /vertex/data/setting \
         /vertex/data/douban/set \
         /vertex/db \
         /vertex/torrents \
         /vertex/logs \
         /vertex/config

# 初始化配置文件
[ ! -f '/vertex/db/sql.db' ] && cp /app/vertex/app/config_backup/sql.db /vertex/db/
[ ! -f '/vertex/config/config.yaml' ] && cp /app/vertex/app/config_backup/*.yaml /vertex/config/ && cp /vertex/config/config.example.yaml /vertex/config/config.yaml
[ ! -f '/vertex/data/setting.json' ] && cp /app/vertex/app/config_backup/setting.json /vertex/data/
[ ! -f '/vertex/data/link-mapping.json' ] && echo '{}' > /vertex/data/link-mapping.json
[ ! -f '/vertex/data/bulk-link-history.json' ] && echo '{}' > /vertex/data/bulk-link-history.json

# 初始化设置文件
for f in torrent-history-setting torrent-mix-setting site-push-setting torrent-push-setting proxy; do
  [ ! -f "/vertex/data/setting/${f}.json" ] && cp "/app/vertex/app/config_backup/${f}.json" /vertex/data/setting/ 2>/dev/null || true
done

# 自定义 hosts
[ -f '/vertex/data/hosts' ] && cat /vertex/data/hosts >> /etc/hosts

echo "
 __      ________ _____ _______ ________   __
 \ \    / /  ____|  __ \__   __|  ____\ \ / /
  \ \  / /| |__  | |__) | | |  | |__   \ V /
   \ \/ / |  __| |  _  /  | |  |  __|   > <
    \  /  | |____| | \ \  | |  | |____ / . \
     \/   |______|_|  \_\ |_|  |______/_/ \_\

STARTING....
"

cp /app/vertex/app/config_backup/logger.yaml /vertex/config/logger.yaml

# 设置用户权限
VUID=${PUID:-0}
VGID=${PGID:-0}
if command -v usermod > /dev/null 2>&1; then
  usermod -o -u ${VUID} vt 2>/dev/null || true
  groupmod -o -g ${VGID} vt 2>/dev/null || true
  usermod -g ${VGID} vt 2>/dev/null || true
else
  deluser vt 2>/dev/null || true
  addgroup -g ${VGID} vt 2>/dev/null || true
  adduser -D -u ${VUID} -G vt -h /app/vertex -s /bin/sh vt 2>/dev/null || true
fi

chown -R ${VUID}:${VGID} /vertex
cp /usr/share/zoneinfo/$TZ /app/localtime 2>/dev/null || true

# ============================================
# 改进的 Redis 启动逻辑
# ============================================

REDIS_PORT=${REDISPORT:-6379}
REDIS_PID_FILE="/tmp/redis.pid"

# 清理旧的 Redis 进程
if [ -f "$REDIS_PID_FILE" ]; then
  OLD_PID=$(cat $REDIS_PID_FILE)
  if [ -n "$OLD_PID" ] && kill -0 $OLD_PID 2>/dev/null; then
    echo "发现旧的 Redis 进程 (PID: $OLD_PID)，正在停止..."
    kill $OLD_PID
    sleep 2
  fi
  rm -f $REDIS_PID_FILE
fi

# 停止所有 Redis 进程
pkill -9 redis-server 2>/dev/null || true
sleep 1

# 清理 Redis socket 和日志
rm -f /tmp/redis.sock 2>/dev/null || true
rm -f /tmp/redis.log 2>/dev/null || true

# 启动 Redis
echo "启动 Redis 服务 (端口: $REDIS_PORT)..."
redis-server /app/redis.conf --port $REDIS_PORT --daemonize yes --pidfile $REDIS_PID_FILE --logfile /tmp/redis.log

# 等待 Redis 启动
echo "等待 Redis 启动..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if redis-cli -p $REDIS_PORT ping > /dev/null 2>&1; then
    echo "Redis 启动成功"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "等待 Redis 启动... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 1
done

# 检查 Redis 是否成功启动
if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "错误: Redis 启动失败"
  echo "Redis 日志:"
  cat /tmp/redis.log 2>/dev/null || echo "无法读取 Redis 日志"
  exit 1
fi

# 验证 Redis 连接
echo "验证 Redis 连接..."
REDIS_TEST=$(redis-cli -p $REDIS_PORT ping)
if [ "$REDIS_TEST" = "PONG" ]; then
  echo "Redis 连接正常"
else
  echo "错误: Redis 连接测试失败: $REDIS_TEST"
  exit 1
fi

# 设置 Redis 配置
echo "配置 Redis..."
redis-cli -p $REDIS_PORT CONFIG SET maxmemory 256mb > /dev/null 2>&1 || true
redis-cli -p $REDIS_PORT CONFIG SET maxmemory-policy allkeys-lru > /dev/null 2>&1 || true

echo "Redis 配置完成"

# ============================================
# 启动应用
# ============================================

echo "启动 Vertex 应用..."
su vt -c "cd /app/vertex && PORT=${PORT:-3000} REDISPORT=$REDIS_PORT node app/app.js"
