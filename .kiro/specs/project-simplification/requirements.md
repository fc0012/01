# Requirements Document

## Introduction

本文档定义了 VERTEX 项目精简的需求规范。根据用户选择，将移除不需要的功能模块，使项目更加轻量化。

## Glossary

- **VERTEX**: PT 追剧刷流管理工具
- **PT Site**: Private Tracker 站点
- **Client**: 下载器客户端
- **Push**: 消息推送服务

## 精简方案总结

| 类别 | 保留 | 移除 |
|------|------|------|
| 下载器 | qBittorrent | Transmission, Deluge |
| 推送 | 无 | Telegram, WeChat, Slack, Ntfy, Webhook |
| PT 站点 | 全部保留 (38个) | 无 |
| 额外功能 | 无 | IRC, ExternalScript, Watch |

## Requirements

### Requirement 1: 下载器客户端精简

**User Story:** As a 用户, I want 仅保留 qBittorrent 支持, so that 减少代码复杂度。

#### Acceptance Criteria

1. WHEN 系统初始化 THEN VERTEX SHALL 仅加载 qBittorrent 客户端模块
2. WHEN Transmission 模块被移除 THEN VERTEX SHALL 删除 app/libs/client/tr.js 文件
3. WHEN Deluge 模块被移除 THEN VERTEX SHALL 删除 app/libs/client/de.js 文件
4. WHEN 客户端模块被移除 THEN VERTEX SHALL 更新相关的导入和配置文件

---

### Requirement 2: 推送功能移除

**User Story:** As a 用户, I want 移除所有推送功能, so that 简化系统架构。

#### Acceptance Criteria

1. WHEN 推送模块被移除 THEN VERTEX SHALL 删除 app/libs/push/ 目录下所有文件
2. WHEN 推送模块被移除 THEN VERTEX SHALL 删除 app/common/Push.js 文件
3. WHEN 推送模块被移除 THEN VERTEX SHALL 删除 app/controller/Push.js 文件
4. WHEN 推送模块被移除 THEN VERTEX SHALL 删除 app/model/PushMod.js 文件
5. WHEN 推送模块被移除 THEN VERTEX SHALL 更新路由配置移除推送相关 API
6. WHEN 其他模块调用推送功能 THEN VERTEX SHALL 将推送调用替换为空操作或移除

---

### Requirement 3: IRC 功能移除

**User Story:** As a 用户, I want 移除 IRC 聊天功能, so that 减少依赖和复杂度。

#### Acceptance Criteria

1. WHEN IRC 模块被移除 THEN VERTEX SHALL 删除 app/common/IRC.js 文件
2. WHEN IRC 模块被移除 THEN VERTEX SHALL 从 package.json 移除 matrix-org-irc 依赖
3. WHEN IRC 模块被移除 THEN VERTEX SHALL 更新相关引用和配置

---

### Requirement 4: 外部脚本功能移除

**User Story:** As a 用户, I want 移除外部脚本执行功能, so that 简化系统。

#### Acceptance Criteria

1. WHEN 外部脚本模块被移除 THEN VERTEX SHALL 删除 app/common/ExternalScript.js 文件
2. WHEN 外部脚本模块被移除 THEN VERTEX SHALL 更新相关引用

---

### Requirement 5: 监控功能移除

**User Story:** As a 用户, I want 移除监控功能, so that 简化系统。

#### Acceptance Criteria

1. WHEN Watch 模块被移除 THEN VERTEX SHALL 删除 app/common/Watch.js 文件
2. WHEN Watch 模块被移除 THEN VERTEX SHALL 删除 app/controller/Watch.js 文件
3. WHEN Watch 模块被移除 THEN VERTEX SHALL 删除 app/model/WatchMod.js 文件
4. WHEN Watch 模块被移除 THEN VERTEX SHALL 更新路由配置移除监控相关 API

---

### Requirement 6: 依赖包精简

**User Story:** As a 用户, I want 移除不需要的 npm 依赖, so that 减少安装体积。

#### Acceptance Criteria

1. WHEN IRC 功能被移除 THEN VERTEX SHALL 从 package.json 移除 matrix-org-irc 依赖
2. WHEN 依赖被移除 THEN VERTEX SHALL 确保剩余功能正常运行

---

### Requirement 7: 系统完整性

**User Story:** As a 用户, I want 精简后的系统保持稳定, so that 核心功能正常使用。

#### Acceptance Criteria

1. WHEN 模块被移除 THEN VERTEX SHALL 确保没有悬空的引用或导入
2. WHEN 模块被移除 THEN VERTEX SHALL 确保路由配置正确更新
3. WHEN 精简完成 THEN VERTEX SHALL 能够正常启动并提供核心功能
4. IF 移除的模块被核心功能依赖 THEN VERTEX SHALL 保留该模块或提供替代方案
