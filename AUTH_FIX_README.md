# Vertex 鉴权问题修复指南

## 问题描述

在安装或重启 Vertex 系统后，用户可能会遇到"鉴权失效"的问题，表现为：
- 登录成功后，刷新页面提示"鉴权失效, 请刷新页面后重新登录"
- API 请求返回 401 错误
- Session 状态无法保持

## 问题根源

经过代码分析，问题的核心原因是：

### 1. Redis Session 丢失
Vertex 使用 Redis 存储用户 session，当容器重启或 Redis 服务异常时，session 数据会丢失。用户的浏览器 cookie 仍然持有旧的 session ID，但 Redis 中找不到对应的 session 数据，导致鉴权失败。

### 2. 关键代码位置
- **Session 配置**: `app/routes/router.js` (第127-138行)
- **鉴权中间件**: `app/routes/router.js` (第30-68行)
- **Redis 配置**: `app/libs/config.js`

## 解决方案

### 方案一：使用诊断和修复脚本（推荐）

#### 1. 诊断问题

运行诊断脚本，检查系统状态：

```bash
cd /opt/vertex  # 或你的安装目录
chmod +x diagnose-auth.sh
./diagnose-auth.sh
```

诊断脚本会检查：
- Docker 环境
- 容器状态
- Redis 服务状态
- 配置文件完整性
- 应用日志
- 网络连接
- 时间同步

#### 2. 修复问题

运行修复脚本，自动修复常见问题：

```bash
chmod +x fix-auth.sh
./fix-auth.sh
```

修复脚本会执行：
1. 备份配置文件
2. 清除 Redis 中的旧 session
3. 重启 Redis 服务
4. 重启容器
5. 检查并修复配置文件
6. 同步系统时间
7. 生成诊断报告

#### 3. 清除浏览器 Cookie

修复后，必须清除浏览器 cookie：

- **方法一**: 使用浏览器无痕/隐私模式
- **方法二**: 手动清除 cookie
  1. 打开开发者工具 (F12)
  2. 进入 Application/存储 标签
  3. 找到 Cookies，清除所有 cookie
- **方法三**: 清除浏览器缓存和 Cookie

#### 4. 重新登录

使用正确的凭据重新登录：
- 用户名: 默认为 `admin`
- 密码: 首次安装时在 `/vertex/data/data/password` 文件中

### 方案二：手动修复

#### 1. 清除 Redis Session

```bash
# 进入容器
docker exec -it vertex sh

# 清除所有 session
redis-cli -p $(printenv REDISPORT || echo 6379) KEYS "vertex:sess:*" | xargs redis-cli -p $(printenv REDISPORT || echo 6379) DEL

# 退出容器
exit
```

#### 2. 重启容器

```bash
cd /opt/vertex
docker compose restart
```

#### 3. 检查配置文件

```bash
# 检查 setting.json 格式
docker exec vertex node -e "JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8'))"

# 如果报错，说明配置文件损坏，需要修复或恢复
```

#### 4. 清除浏览器 Cookie 并重新登录

同方案一。

### 方案三：使用改进的启动脚本

如果问题频繁出现，可以使用改进的启动脚本：

```bash
# 备份原启动脚本
cp /app/vertex/docker/start.sh /app/vertex/docker/start.sh.bak

# 使用改进的启动脚本
cp start-improved.sh /app/vertex/docker/start.sh

# 重启容器
docker compose restart
```

改进的启动脚本增加了：
- 更健壮的 Redis 启动逻辑
- 自动清理旧的 Redis 进程
- Redis 启动状态检测
- Redis 连接验证
- 自动配置 Redis 参数

## 预防措施

### 1. 配置 Redis 持久化

修改 Redis 配置文件 `/app/redis.conf`：

```conf
# 启用 RDB 持久化
save 900 1
save 300 10
save 60 10000

# 启用 AOF 持久化
appendonly yes
appendfsync everysec

# 设置最大内存和淘汰策略
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 2. 使用 Docker Volume

在 `docker-compose.yml` 中添加 Redis 数据卷：

```yaml
services:
  vertex:
    image: cczc9962/vertex02:stable
    container_name: vertex
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./data:/vertex
      - ./redis-data:/var/lib/redis  # 新增
    environment:
      - TZ=Asia/Shanghai
      - REDISPORT=6379
```

### 3. 监控 Redis 状态

定期检查 Redis 状态：

```bash
# 检查 Redis 进程
docker exec vertex pgrep redis-server

# 测试 Redis 连接
docker exec vertex redis-cli -p 6379 ping

# 查看 Redis 信息
docker exec vertex redis-cli -p 6379 INFO
```

### 4. 配置健康检查

在 `docker-compose.yml` 中添加健康检查：

```yaml
services:
  vertex:
    # ... 其他配置
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "6379", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 常见问题

### Q1: 修复后仍然无法登录？

**A**: 请检查以下几点：
1. 确认配置文件 `setting.json` 中的用户名和密码正确
2. 确认 Redis 服务正常运行
3. 确认浏览器 cookie 已清除
4. 查看应用日志：`docker logs vertex`

### Q2: 如何查看初始密码？

**A**: 初始密码保存在：
```bash
cat /opt/vertex/data/data/password
```

### Q3: Redis 一直启动失败？

**A**: 检查以下几点：
1. 端口是否被占用：`docker exec vertex netstat -tlnp | grep 6379`
2. Redis 配置文件是否正确：`docker exec vertex cat /app/redis.conf`
3. 查看 Redis 日志：`docker exec vertex cat /tmp/redis.log`

### Q4: 如何禁用 Redis Session？

**A**: 不建议禁用，但如果必须使用内存存储，可以修改 `app/routes/router.js`：

```javascript
// 将 RedisStore 改为 MemoryStore
const MemoryStore = require('express-session').MemoryStore;
const store = new MemoryStore();

app.use(session({
  // ... 其他配置
  store: store,
  // ...
}));
```

注意：使用内存存储时，容器重启会丢失所有 session。

## 技术细节

### Session 工作流程

1. **登录**: 用户提交登录信息 → 服务器验证 → 创建 session → 存储到 Redis → 返回 cookie
2. **请求**: 浏览器发送 cookie → 服务器读取 session ID → 从 Redis 获取 session → 验证用户 → 处理请求
3. **刷新**: 浏览器刷新页面 → 发送 cookie → Redis 中找不到 session → 返回 401 错误

### Redis Session 配置

```javascript
app.use(session({
  genid: () => util.uuid.v4().replace(/-/g, ''),  // 生成 session ID
  resave: false,                                   // 不强制保存
  rolling: true,                                   // 每次请求刷新过期时间
  saveUninitialized: false,                        // 不保存未初始化的 session
  store: new RedisStore(redisConfig),              // 使用 Redis 存储
  secret: 'sses:xetrev',                           // 签名密钥
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30              // 30天有效期
  }
}));
```

### 鉴权中间件逻辑

```javascript
const checkAuth = async function (req, res, next) {
  const pathname = req._parsedOriginalUrl.pathname;

  // 排除路径（不需要鉴权）
  const excludePath = [
    '/api/user/login',
    '/api/setting/getBackground.less',
    '/api/setting/getCss.css',
    '/user/login',
    '/service-worker.js',
    '/service-worker.js.map'
  ];

  // 已登录用户访问登录页，重定向到首页
  if (req.session?.user && ['/', '/user/login'].includes(pathname)) {
    return res.redirect(302, '/index');
  }

  // 排除路径直接放行
  if (excludePath.includes(pathname) ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/workbox') ||
      pathname.startsWith('/api/openapi') ||
      pathname === '/favicon.ico') {
    return next();
  }

  // 未登录的页面请求，重定向到登录页
  if (!req.session?.user && !pathname.startsWith('/api')) {
    return res.redirect(302, '/user/login');
  }

  // 未登录的 API 请求，返回 401
  if (!req.session?.user) {
    res.status(401);
    return res.send({
      success: false,
      message: '鉴权失效, 请刷新页面后重新登录'
    });
  }

  next();
};
```

## 联系支持

如果问题仍然无法解决，请提供以下信息：
1. 诊断报告输出
2. 应用日志：`docker logs vertex --tail 100`
3. Redis 状态：`docker exec vertex redis-cli -p 6379 INFO`
4. 浏览器控制台错误信息

## 更新日志

### v1.0.0 (2024-01-25)
- 创建诊断脚本 `diagnose-auth.sh`
- 创建修复脚本 `fix-auth.sh`
- 创建改进的启动脚本 `start-improved.sh`
- 编写完整的修复指南

## 许可证

本指南和脚本遵循与 Vertex 项目相同的许可证。
