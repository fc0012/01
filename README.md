# VERTEX

<img src="https://raw.githubusercontent.com/vertex-app/vertex/stable/webui/public/assets/images/logo.svg" width="144"/>

#### 适用于 PT 玩家的追剧刷流一体化综合管理工具
原版https://github.com/vertex-app/vertex

## 下载器支持

VERTEX 目前仅支持 **qBittorrent** 作为下载器。

### qBittorrent 安装方式

#### 方式一：使用安装脚本自动安装（推荐）

在安装 VERTEX 时，安装脚本会提示是否安装 qBittorrent Dedicated Seedbox。选择 "Y" 即可自动安装。

自动安装特点：
- 使用 jerry048 的 Dedicated-Seedbox 安装脚本
- 自动生成随机用户名和密码（用户名格式：qb_xxxxxxxx）
- 缓存大小自动设置为系统内存的 1/8（最小 256 MiB）
- Web UI 默认端口：8080

安装完成后，访问 `http://你的服务器IP:8080` 即可使用 qBittorrent Web UI。

#### 方式二：手动安装 qBittorrent

如果你想手动安装 qBittorrent，可以参考以下方式：

**使用 Docker 安装：**
```bash
docker run -d \
  --name qbittorrent \
  -p 8080:8080 \
  -p 6881:6881 \
  -p 6881:6881/udp \
  -v /path/to/config:/config \
  -v /path/to/downloads:/downloads \
  linuxserver/qbittorrent
```

**使用包管理器安装：**
```bash
# Ubuntu/Debian
sudo apt-get install qbittorrent-nox

# CentOS/RHEL
sudo yum install qbittorrent-nox
```

### 在 VERTEX 中配置 qBittorrent

1. 登录 VERTEX 系统
2. 进入"下载器"页面
3. 点击"新增 | 编辑下载器"
4. 填写以下信息：
   - **别名**：给下载器取一个名字
   - **下载器类型**：选择 qBittorrent
   - **用户名**：qBittorrent 的登录用户名
   - **密码**：qBittorrent 的登录密码
   - **URL**：qBittorrent 的 Web UI 地址（例如：`http://localhost:8080`，注意不要在末尾加 `/`）
   - **信息更新周期**：Cron 表达式，默认为 `*/4 * * * * *`（每 4 秒更新一次）
   - 其他选项根据需要配置

### qBittorrent 配置建议

为了获得最佳体验，建议对 qBittorrent 进行以下配置：

1. **Web UI 设置**：
   - 启用 Web UI
   - 设置用户名和密码
   - 端口设置为 8080（或其他未被占用的端口）

2. **连接设置**：
   - 全局最大连接数：根据服务器性能调整（建议 500-1000）
   - 每个种子最大连接数：根据种子大小调整（建议 50-100）

3. **速度限制**：
   - 根据服务器带宽设置合理的上传/下载速度限制
   - 可以在 VERTEX 中设置上限上传/下载速度

4. **缓存设置**：
   - 如果使用 jerry048 的安装脚本，缓存已自动优化
   - 手动安装建议根据系统内存设置缓存大小

## 一键安装

在 Linux 服务器上执行以下命令即可快速安装 VERTEX：

```bash
bash <(curl -sSL https://raw.githubusercontent.com/fc0012/01/stable/install.sh)
```

或者使用 wget：

```bash
bash <(wget -qO- https://raw.githubusercontent.com/fc0012/01/stable/install.sh)
```

安装完成后，访问 `http://你的服务器IP:3000` 即可使用 VERTEX。


