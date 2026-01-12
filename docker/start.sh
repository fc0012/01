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

# 启动服务
redis-server /app/redis.conf --port ${REDISPORT:-6379}
su vt -c "cd /app/vertex && PORT=${PORT:-3000} node app/app.js"
