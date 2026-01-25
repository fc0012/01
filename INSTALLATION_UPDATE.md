# 安装脚本更新说明

## 更新内容

### qBittorrent 安装自动化

已将 qBittorrent 安装从交互式改为完全自动化，无需用户输入任何参数。

### 自动配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 用户名 | `admin` | 固定用户名 |
| 密码 | `adminadmin` | 固定密码 |
| 版本 | `4.3.9` | 固定版本 |
| 缓存大小 | 内存的1/8 | 自动检测，最小 256 MiB |

### 缓存大小计算

```bash
# 1. 检测系统内存（单位：GiB）
total_mem_gb = total_mem_kb / 1024 / 1024

# 2. 计算缓存大小（内存的1/8）
sb_cache = total_mem_gb / 8

# 3. 转换为 MiB（1 GiB = 1024 MiB）
cache_mib = sb_cache * 1024

# 4. 确保最小值为 256 MiB
if cache_mib < 256 then
    cache_mib = 256
    sb_cache = 1
fi
```

### 示例

| 系统内存 | 自动配置的缓存 |
|---------|---------------|
| 1 GiB | 256 MiB (最小值) |
| 2 GiB | 256 MiB (最小值) |
| 4 GiB | 512 MiB |
| 8 GiB | 1 GiB |
| 16 GiB | 2 GiB |
| 32 GiB | 4 GiB |

## 使用方法

### 基本安装（推荐）

```bash
bash install.sh
```

这将自动：
1. 安装 Docker 和 Docker Compose
2. 安装 VERTEX 系统
3. 自动安装 qBittorrent（版本 4.3.9，缓存为内存的1/8）

### 自定义安装目录和端口

```bash
bash install.sh -d /opt/myvertex -p 8080
```

### 仅安装 VERTEX（跳过 qBittorrent）

```bash
bash install.sh --skip-qb
```

## 安装完成后的访问信息

### VERTEX 系统

- **Web UI**: `http://<服务器IP>:3000`
- **用户名**: `admin`
- **密码**: 查看 `/opt/vertex/data/data/password` 文件

### qBittorrent

- **Web UI**: `http://<服务器IP>:8080`
- **NOX**: `http://<服务器IP>:8090`
- **用户名**: `admin`
- **密码**: `adminadmin`

## 常用命令

### VERTEX 管理

```bash
# 进入安装目录
cd /opt/vertex

# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart
```

### qBittorrent 管理

```bash
# 查看 qBittorrent 状态
systemctl status qbittorrent-nox

# 启动 qBittorrent
systemctl start qbittorrent-nox

# 停止 qBittorrent
systemctl stop qbittorrent-nox

# 重启 qBittorrent
systemctl restart qbittorrent-nox

# 查看 qBittorrent 日志
journalctl -u qbittorrent-nox -f
```

## 故障排查

### 问题1：qBittorrent 无法访问

**检查 qBittorrent 服务状态**：
```bash
systemctl status qbittorrent-nox
```

**如果服务未运行，启动它**：
```bash
systemctl start qbittorrent-nox
```

**查看日志**：
```bash
journalctl -u qbittorrent-nox -n 50
```

### 问题2：缓存大小不合适

如果需要调整缓存大小，可以重新安装 qBittorrent：

```bash
# 停止并卸载 qBittorrent
systemctl stop qbittorrent-nox
systemctl disable qbittorrent-nox
rm -rf /opt/qBittorrent

# 重新安装（手动指定参数）
bash <(curl -sSL https://raw.githubusercontent.com/jerry048/Dedicated-Seedbox/main/Install.sh) \
    -u admin \
    -p adminadmin \
    -c <缓存大小MiB> \
    -q 4.3.9 \
    -l 1
```

### 问题3：端口被占用

如果 8080 或 8090 端口被占用，可以修改 qBittorrent 配置：

```bash
# 编辑配置文件
nano ~/.config/qBittorrent/qBittorrent.conf

# 修改以下行：
# Connection\PortRangeMin=8080
# Preferences\WebUI\Port=8080

# 重启服务
systemctl restart qbittorrent-nox
```

## 版本说明

### 当前安装的 qBittorrent 版本

- **版本**: 4.3.9
- **发布日期**: 2021-05-22
- **稳定性**: 非常稳定，广泛使用
- **兼容性**: 与大多数 PT 站点兼容

### 为什么选择 4.3.9？

1. **稳定性**: 经过长期测试，非常稳定
2. **兼容性**: 与所有 PT 站点兼容
3. **性能**: 性能优秀，资源占用合理
4. **功能**: 包含所有必要的功能
5. **社区支持**: 社区支持良好

### 其他可用版本

如果需要其他版本，可以手动修改 `install.sh` 中的 `sb_ver` 变量：

```bash
# 在 install.sh 中找到这一行：
local sb_ver="4.3.9"

# 修改为其他版本，例如：
local sb_ver="4.5.5"
# 或
local sb_ver="4.6.7"
```

## 更新日志

### v1.1.0 (2024-01-25)
- ✅ 将 qBittorrent 安装改为完全自动化
- ✅ 自动检测系统内存并设置缓存大小（1/8，最小 256 MiB）
- ✅ 固定版本为 4.3.9
- ✅ 固定用户名/密码为 admin/adminadmin
- ✅ 移除所有用户输入提示
- ✅ 更新使用说明文档

### v1.0.0
- 初始版本
- 交互式安装 VERTEX 和 qBittorrent

## 技术支持

如果遇到问题，请提供以下信息：
1. 系统内存大小：`free -h`
2. qBittorrent 服务状态：`systemctl status qbittorrent-nox`
3. qBittorrent 日志：`journalctl -u qbittorrent-nox -n 100`
4. 安装日志：查看安装过程的输出

## 许可证

本脚本遵循与 Vertex 项目相同的许可证。
