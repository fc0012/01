# Implementation Plan

## 项目精简实施任务

- [x] 1. 移除下载器客户端模块
  - [x] 1.1 删除 Transmission 适配模块
    - 删除 app/libs/client/tr.js 文件
    - _Requirements: 1.2_
  - [x] 1.2 删除 Deluge 适配模块
    - 删除 app/libs/client/de.js 文件
    - _Requirements: 1.3_

- [x] 2. 移除推送功能模块
  - [x] 2.1 删除推送适配模块目录
    - 删除 app/libs/push/ 目录及所有文件
    - _Requirements: 2.1_
  - [x] 2.2 创建空的 Push 替代类
    - 修改 app/common/Push.js，将所有方法改为空实现
    - 保留类结构以避免其他模块调用报错
    - _Requirements: 2.6_
  - [x] 2.3 删除推送控制器和模型
    - 删除 app/controller/Push.js
    - 删除 app/model/PushMod.js
    - _Requirements: 2.3, 2.4_
  - [x] 2.4 更新路由配置移除推送 API
    - 修改 app/routes/router.js，移除 /notification/* 路由
    - _Requirements: 2.5_

- [x] 3. 移除 IRC 功能模块
  - [x] 3.1 删除 IRC 模块文件
    - 删除 app/common/IRC.js
    - _Requirements: 3.1_
  - [x] 3.2 移除 IRC 依赖包
    - 从 package.json 移除 matrix-org-irc 依赖
    - _Requirements: 3.2, 6.1_

- [x] 4. 移除外部脚本功能
  - [x] 4.1 删除外部脚本模块
    - 删除 app/common/ExternalScript.js
    - _Requirements: 4.1_

- [x] 5. 移除监控功能模块
  - [x] 5.1 删除监控模块文件
    - 删除 app/common/Watch.js
    - 删除 app/controller/Watch.js
    - 删除 app/model/WatchMod.js
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 5.2 更新路由配置移除监控 API
    - 修改 app/routes/router.js，移除 /watch/* 路由
    - _Requirements: 5.4_

- [x] 6. 清理代码引用
  - [x] 6.1 检查并清理悬空引用
    - 搜索所有对已移除模块的 require 语句
    - 移除或注释掉相关引用
    - _Requirements: 7.1_
  - [x] 6.2 更新 util.js 中的相关函数
    - 检查 app/libs/util.js 中是否有对已移除模块的引用
    - _Requirements: 7.1_

- [x] 7. 清理临时文件
  - [x] 7.1 删除开发用 Docker 配置
    - 删除 Dockerfile.dev
    - 删除 docker-compose.dev.yml
    - _Requirements: 清理临时文件_

- [x] 8. 最终检查


  - 确认所有文件已正确删除
  - 确认代码无悬空引用
  - _Requirements: 7.1, 7.2, 7.3_
