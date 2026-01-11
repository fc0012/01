# Design Document: VERTEX 项目精简

## Overview

本设计文档描述了 VERTEX 项目精简的技术方案。根据用户需求，将移除 Transmission/Deluge 下载器、全部推送功能、IRC、外部脚本和监控功能，仅保留 qBittorrent 和全部 PT 站点支持。

## Architecture

### 当前架构

```
VERTEX
├── app/
│   ├── common/          # 核心业务逻辑
│   │   ├── Client.js    # 下载器管理 [保留]
│   │   ├── ExternalScript.js  # 外部脚本 [移除]
│   │   ├── IRC.js       # IRC 聊天 [移除]
│   │   ├── Push.js      # 消息推送 [移除]
│   │   ├── Rss.js       # RSS 订阅 [保留]
│   │   ├── Script.js    # 脚本任务 [保留]
│   │   ├── Server.js    # 服务器管理 [保留]
│   │   ├── Site.js      # 站点管理 [保留]
│   │   └── Watch.js     # 监控功能 [移除]
│   ├── controller/      # API 控制器
│   ├── libs/
│   │   ├── client/      # 下载器适配
│   │   │   ├── qb.js    # qBittorrent [保留]
│   │   │   ├── tr.js    # Transmission [移除]
│   │   │   └── de.js    # Deluge [移除]
│   │   ├── push/        # 推送适配 [全部移除]
│   │   └── site/        # 站点适配 [全部保留]
│   ├── model/           # 数据模型
│   └── routes/          # 路由配置
```

### 精简后架构

```
VERTEX (精简版)
├── app/
│   ├── common/
│   │   ├── Client.js
│   │   ├── Rss.js
│   │   ├── Script.js
│   │   ├── Server.js
│   │   └── Site.js
│   ├── controller/
│   │   └── [移除 Push.js, Watch.js]
│   ├── libs/
│   │   ├── client/
│   │   │   └── qb.js    # 仅保留 qBittorrent
│   │   └── site/        # 全部保留
│   ├── model/
│   │   └── [移除 PushMod.js, WatchMod.js]
│   └── routes/
```

## Components and Interfaces

### 需要移除的文件

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| 下载器 | app/libs/client/tr.js | Transmission 适配 |
| 下载器 | app/libs/client/de.js | Deluge 适配 |
| 推送 | app/libs/push/*.js | 全部推送模块 |
| 推送 | app/common/Push.js | 推送核心逻辑 |
| 推送 | app/controller/Push.js | 推送 API |
| 推送 | app/model/PushMod.js | 推送数据模型 |
| IRC | app/common/IRC.js | IRC 聊天 |
| 外部脚本 | app/common/ExternalScript.js | 外部脚本执行 |
| 监控 | app/common/Watch.js | 监控核心逻辑 |
| 监控 | app/controller/Watch.js | 监控 API |
| 监控 | app/model/WatchMod.js | 监控数据模型 |

### 需要修改的文件

| 文件路径 | 修改内容 |
|----------|----------|
| app/routes/router.js | 移除推送和监控相关路由 |
| app/common/Rss.js | 移除推送调用，替换为空操作 |
| app/common/Client.js | 移除推送调用 |
| app/common/Site.js | 移除推送调用 |
| package.json | 移除 matrix-org-irc 依赖 |

### 推送调用处理策略

由于多个模块调用了 Push 功能，需要创建一个空的 Push 替代类：

```javascript
// app/common/Push.js (替代版本)
class Push {
  constructor() {}
  async rssError() {}
  async addTorrent() {}
  async addTorrentError() {}
  async deleteTorrent() {}
  // ... 其他方法都返回空
}
module.exports = Push;
```

或者直接在调用处移除推送相关代码。

## Data Models

### 移除的数据模型

- PushMod.js - 推送配置存储
- WatchMod.js - 监控任务存储

### 保留的数据模型

- ClientMod.js - 下载器配置
- SiteMod.js - 站点配置
- RssMod.js - RSS 订阅配置
- 其他核心模型

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 无悬空引用
*For any* 被移除的模块，系统中不应存在对该模块的 require/import 语句
**Validates: Requirements 7.1**

### Property 2: 推送调用安全
*For any* 原本调用推送功能的代码路径，调用应该不会抛出异常（通过空实现或移除）
**Validates: Requirements 2.6**

### Property 3: 路由完整性
*For any* 保留的 API 路由，对应的控制器方法应该存在且可调用
**Validates: Requirements 7.2**

## Error Handling

### 模块移除后的错误处理

1. **推送调用**：使用空实现类，所有方法返回空，不抛出异常
2. **下载器选择**：如果用户配置了已移除的下载器类型，在加载时给出警告日志
3. **路由访问**：已移除功能的 API 返回 404 或适当的错误信息

## Testing Strategy

### 单元测试

- 验证移除的文件确实不存在
- 验证 package.json 中不包含移除的依赖
- 验证路由配置中不包含移除的路由

### 集成测试

- 验证应用能够正常启动
- 验证核心功能（RSS、站点、下载器）正常工作

### Property-Based Testing

使用 fast-check 库进行属性测试：

1. **无悬空引用测试**：扫描所有 JS 文件，验证不存在对已移除模块的引用
2. **推送调用安全测试**：模拟各种推送调用场景，验证不会抛出异常
