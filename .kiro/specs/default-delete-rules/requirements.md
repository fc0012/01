# Requirements Document

## Introduction

本功能旨在为 VERTEX 系统提供开箱即用的删种规则。当用户首次安装 VERTEX 后，系统将自动创建一组常用的默认删种规则，帮助用户快速开始使用删种功能，无需从零开始配置。

## Glossary

- **Delete_Rule_System**: VERTEX 中负责管理和执行删种规则的子系统
- **Default_Delete_Rule**: 系统预置的删种规则，在首次安装时自动创建
- **Rule_Data_Directory**: 存储删种规则 JSON 文件的目录 (`app/data/rule/delete/`)
- **Condition**: 删种规则中的单个判断条件，包含 key、compareType 和 value 三个属性
- **Normal_Rule**: 基于条件组合的普通删种规则
- **JavaScript_Rule**: 使用自定义 JavaScript 代码的高级删种规则

## Requirements

### Requirement 1

**User Story:** As a new user, I want to have pre-configured delete rules available after installation, so that I can start managing torrents immediately without manual configuration.

#### Acceptance Criteria

1. WHEN the Delete_Rule_System initializes for the first time THEN the Delete_Rule_System SHALL create a set of Default_Delete_Rules in the Rule_Data_Directory
2. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL generate unique IDs for each rule following the existing UUID format
3. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL store each rule as a separate JSON file in the Rule_Data_Directory
4. WHEN the Rule_Data_Directory already contains rules THEN the Delete_Rule_System SHALL skip creating Default_Delete_Rules to preserve user configurations

### Requirement 2

**User Story:** As a user, I want the default delete rules to cover common use cases, so that I can handle typical torrent management scenarios.

#### Acceptance Criteria

1. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting torrents with tracker errors (返回信息包含 "unregistered" 或 "not registered")
2. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting stalled downloads (种子状态为 stalledDL 且添加时间超过阈值)
3. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting completed torrents with high ratio (分享率大于设定值且完成时间超过阈值)
4. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting torrents when disk space is low (剩余空间小于阈值)
5. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting torrents with zero upload speed for extended period (上传速度为0且做种时间超过阈值)
6. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL include a rule for deleting torrents that exceed seeding time threshold (做种时间超过指定天数)

### Requirement 3

**User Story:** As a user, I want the default delete rules to have sensible default values, so that they work safely without immediate adjustment.

#### Acceptance Criteria

1. WHEN a Default_Delete_Rule is created THEN the Delete_Rule_System SHALL set the priority field to a reasonable default value
2. WHEN a Default_Delete_Rule is created THEN the Delete_Rule_System SHALL set the fitTime field to prevent accidental immediate deletion
3. WHEN a Default_Delete_Rule is created THEN the Delete_Rule_System SHALL set descriptive alias names in Chinese for easy identification
4. WHEN a Default_Delete_Rule is created THEN the Delete_Rule_System SHALL use the "normal" type with condition-based logic for transparency

### Requirement 4

**User Story:** As a user, I want to be able to modify or delete the default rules, so that I can customize them to my specific needs.

#### Acceptance Criteria

1. WHEN Default_Delete_Rules are created THEN the Delete_Rule_System SHALL store them in the same format as user-created rules
2. WHEN a user modifies a Default_Delete_Rule THEN the Delete_Rule_System SHALL persist the changes using the existing modify mechanism
3. WHEN a user deletes a Default_Delete_Rule THEN the Delete_Rule_System SHALL remove the rule using the existing delete mechanism

### Requirement 5

**User Story:** As a developer, I want the default rules initialization to be idempotent, so that system restarts do not create duplicate rules.

#### Acceptance Criteria

1. WHEN the Delete_Rule_System initializes THEN the Delete_Rule_System SHALL check for existing rules before creating defaults
2. WHEN the Rule_Data_Directory contains one or more JSON files THEN the Delete_Rule_System SHALL skip the default rule creation process
3. WHEN the Rule_Data_Directory is empty or does not exist THEN the Delete_Rule_System SHALL create the directory and populate it with Default_Delete_Rules

