# 密码安全指南

## ⚠️ 重要安全提醒

**安装完成后请立即更改默认密码！**

使用默认密码存在严重的安全风险，您的账户可能会被未授权访问。

---

## 📋 默认凭据

### VERTEX 系统

| 项目 | 默认值 | 说明 |
|------|--------|------|
| 用户名 | `admin` | 系统管理员 |
| 密码 | 随机生成 | 首次安装时自动生成，保存在 `/vertex/data/data/password` |

### qBittorrent

| 项目 | 默认值 | 说明 |
|------|--------|------|
| 用户名 | `admin` | Web UI 管理员 |
| 密码 | `adminadmin` | 默认密码 |

---

## 🔒 更改 VERTEX 密码

### 方法一：通过 Web 界面（推荐）

1. **登录 VERTEX 系统**
   - 访问：`http://<服务器IP>:3000`
   - 使用默认凭据登录

2. **进入安全设置**
   - 点击左侧菜单：**系统设置**
   - 选择：**安全设置**

3. **修改密码**
   - 在"密码"字段输入新密码
   - 点击"保存"按钮

4. **验证更改**
   - 退出登录
   - 使用新密码重新登录

### 方法二：通过命令行

```bash
# 进入容器
docker exec -it vertex sh

# 生成新密码的 MD5 哈希值
node -e "console.log(require('crypto').createHash('md5').update('你的新密码').digest('hex'))"

# 编辑配置文件
vi /vertex/data/setting.json

# 找到 "password" 字段，替换为上面生成的 MD5 哈希值
# 示例："password": "5f4dcc3b5aa765d61d8327deb882cf99"

# 保存并退出容器
exit

# 重启容器
cd /opt/vertex && docker compose restart
```

### 密码要求

- 长度：至少 6 个字符
- 建议：包含大小写字母、数字和特殊字符
- 示例：`MySecure@Pass123`

---

## 🔒 更改 qBittorrent 密码

### 方法一：通过 Web 界面（推荐）

1. **登录 qBittorrent Web UI**
   - 访问：`http://<服务器IP>:8080`
   - 使用默认凭据登录（admin/adminadmin）

2. **进入选项设置**
   - 点击顶部菜单：**工具**
   - 选择：**选项**

3. **修改 Web UI 密码**
   - 选择左侧：**Web UI** 标签
   - 找到"认证"部分
   - 输入当前密码（adminadmin）
   - 输入新密码
   - 点击"应用"或"确定"按钮

4. **验证更改**
   - 退出登录
   - 使用新密码重新登录

### 方法二：通过配置文件

```bash
# 停止 qBittorrent 服务
systemctl stop qbittorrent-nox

# 备份配置文件
cp ~/.config/qBittorrent/qBittorrent.conf ~/.config/qBittorrent/qBittorrent.conf.bak

# 编辑配置文件
vi ~/.config/qBittorrent/qBittorrent.conf

# 找到并修改以下行：
# Preferences\WebUI\Username=admin
# Preferences\WebUI\Password_PBKDF2="@ByteArray(ARQ77eY1NUZaQsuDHbIMCA==:0WMRkYTUWVT9wVvdDtHAjU9b3b7uB8NR1Gur2hmQCvCDpm39Q+PsJRJPaCU51dEiz+dTzh8qbPsL8WkFljQYFQ==)"

# 生成新的 PBKDF2 密码哈希（需要使用 qBittorrent 工具）
# 或者使用在线工具生成：https://calculat.io/en/hash/pbkdf2

# 启动 qBittorrent 服务
systemctl start qbittorrent-nox
```

**注意**：方法二比较复杂，建议使用方法一。

---

## 🔐 密码安全最佳实践

### 1. 使用强密码

**好的密码示例**：
- `Tr0ub4dor&3`
- `Correct-Horse-Battery-Staple`
- `MyV3rtex!Pass#2024`

**不好的密码示例**：
- `password`
- `123456`
- `admin`
- `qwerty`

### 2. 密码长度

| 安全级别 | 最小长度 | 推荐长度 |
|---------|---------|---------|
| 低 | 6 字符 | 8 字符 |
| 中 | 8 字符 | 12 字符 |
| 高 | 12 字符 | 16+ 字符 |

### 3. 密码复杂度

强密码应包含：
- ✅ 大写字母（A-Z）
- ✅ 小写字母（a-z）
- ✅ 数字（0-9）
- ✅ 特殊字符（!@#$%^&*）

### 4. 定期更改密码

- 建议：每 3-6 个月更改一次
- 在以下情况应立即更改：
  - 怀疑密码泄露
  - 系统遭受攻击
  - 管理员离职

### 5. 不要重复使用密码

- 不要在多个系统使用相同密码
- 如果一个系统被攻破，其他系统也会受影响

### 6. 使用密码管理器

推荐的密码管理器：
- Bitwarden（免费，开源）
- KeePass（免费，开源）
- 1Password（付费）
- LastPass（免费版可用）

---

## 🛡️ 额外安全措施

### 1. 启用两步验证（2FA）

VERTEX 支持两步验证：

1. 登录 VERTEX 系统
2. 进入：**系统设置 → 安全设置**
3. 在"二步验证"部分：
   - 扫描二维码（使用 Google Authenticator 或 Authy）
   - 输入验证码确认
4. 保存设置

### 2. 更改默认用户名

建议将默认用户名 `admin` 改为其他名称：

1. 进入：**系统设置 → 安全设置**
2. 修改"用户名"字段
3. 保存设置

### 3. 限制访问 IP

使用防火墙限制访问：

```bash
# 只允许特定 IP 访问 VERTEX
iptables -A INPUT -p tcp --dport 3000 -s <你的IP> -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP

# 只允许特定 IP 访问 qBittorrent
iptables -A INPUT -p tcp --dport 8080 -s <你的IP> -j ACCEPT
iptables -A INPUT -p tcp --dport 8080 -j DROP
```

### 4. 启用 HTTPS

使用反向代理（Nginx/Caddy）启用 HTTPS：

```nginx
# Nginx 配置示例
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. 定期备份

定期备份配置文件：

```bash
# 备份 VERTEX 配置
cd /opt/vertex
tar -czf vertex-backup-$(date +%Y%m%d).tar.gz data/

# 备份 qBittorrent 配置
tar -czf qbittorrent-backup-$(date +%Y%m%d).tar.gz ~/.config/qBittorrent/
```

---

## 🚨 密码泄露应急处理

如果怀疑密码泄露：

1. **立即更改密码**
   - 更改 VERTEX 密码
   - 更改 qBittorrent 密码

2. **检查登录日志**
   ```bash
   # VERTEX 日志
   docker logs vertex --tail 100

   # qBittorrent 日志
   journalctl -u qbittorrent-nox -n 100
   ```

3. **检查异常活动**
   - 查看最近的活动记录
   - 检查上传/下载历史

4. **启用审计日志**
   - 启用详细的访问日志
   - 定期审查日志

5. **通知用户**
   - 如果是多用户系统，通知所有用户
   - 要求所有用户更改密码

---

## 📞 获取帮助

如果遇到密码相关问题：

1. **查看文档**
   - VERTEX Wiki：https://wiki.vertex-app.top
   - qBittorrent 文档：https://www.qbittorrent.org/

2. **检查日志**
   ```bash
   # VERTEX 日志
   docker logs vertex -f

   # qBittorrent 日志
   journalctl -u qbittorrent-nox -f
   ```

3. **重置密码**
   - 如果忘记密码，可以重置配置文件
   - 参考本文档的"通过命令行更改密码"部分

---

## ✅ 安全检查清单

安装完成后，请确认：

- [ ] 已更改 VERTEX 默认密码
- [ ] 已更改 qBittorrent 默认密码
- [ ] 已启用两步验证（可选但推荐）
- [ ] 已更改默认用户名（可选）
- [ ] 已配置防火墙规则（可选）
- [ ] 已启用 HTTPS（可选）
- [ ] 已设置定期备份
- [ ] 已记录新密码（安全存储）

---

## 📝 参考资源

- [OWASP 密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [密码强度测试工具](https://www.passwordmeter.com/)
- [密码管理器比较](https://www.pcmag.com/picks/the-best-password-managers)

---

**最后更新**: 2024-01-25
**版本**: 1.0.0
