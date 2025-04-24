# 数据库架构管理模块

本目录包含了应用程序的数据库架构管理相关代码，负责定义、注册、转换和版本管理数据库表结构。

## 目录结构

```
./
├── adapters/               # 数据库适配器目录
│   └── drizzle-adapter.ts  # Drizzle ORM 适配器实现
├── definitions/            # 表结构定义目录
│   ├── README.md           # 数据库表结构定义指南
│   ├── dating-schemas.ts   # 约会相关表结构定义
│   ├── match-schema.ts     # 匹配表结构定义
│   ├── message-schema.ts   # 消息表结构定义
│   └── user-schema.ts      # 用户表结构定义
├── drizzle-schema.ts       # Drizzle ORM 专用模式定义
├── entity-converter.ts     # 实体数据转换器
├── index.ts                # 模块导出文件
├── schema-registry.ts      # 表结构注册表
├── table-converter.ts      # 表结构转换器
├── types.ts                # 类型定义
├── version-manager.ts      # 数据库版本管理器
└── versions.ts             # 数据库版本定义
```

## 核心组件

### 1. 数据库版本管理

#### versions.ts

定义了数据库的各个版本及其对应的升级语句。每个版本包含一组SQL语句，用于创建或修改表结构、添加索引等。

主要功能：
- 定义数据库版本列表 `databaseVersions`
- 提供获取最新版本号的方法 `getLatestVersion()`
- 提供获取升级语句的方法 `getUpgradeStatements()`
- 提供验证版本号的方法 `validateVersion()`

#### version-manager.ts

实现了数据库版本管理的核心逻辑，采用单例模式。

主要功能：
- 管理当前数据库版本
- 检查是否需要升级
- 获取升级语句
- 控制升级过程（开始、完成、回滚）

### 2. 表结构定义与注册

#### types.ts

定义了表结构相关的接口和类型。

主要类型：
- `TableSchema`: 表结构接口
- `ColumnDefinition`: 列定义接口
- `ColumnType`: 列类型定义
- `IndexDefinition`: 索引定义接口
- `ISchemaRegistry`: 表结构注册表接口

#### schema-registry.ts

实现了表结构注册表，采用单例模式，用于管理所有表结构定义。

主要功能：
- 注册表结构
- 获取表结构
- 检查表是否存在
- 删除表结构

#### definitions/

包含了各个表的具体结构定义，每个文件定义一个或多个相关表结构，并注册到 `SchemaRegistry`。

主要文件：
- `user-schema.ts`: 用户表结构定义
- `match-schema.ts`: 匹配表结构定义
- `message-schema.ts`: 消息表结构定义
- `dating-schemas.ts`: 约会相关表结构定义

### 3. 数据转换与适配

#### table-converter.ts

将通用表结构定义转换为特定数据库的表定义。

主要功能：
- 将 `TableSchema` 转换为特定数据库的表定义
- 支持不同数据库类型的转换

#### entity-converter.ts

负责实体数据与数据库记录之间的转换。

主要功能：
- 将实体数据转换为数据库格式
- 将数据库数据转换为实体格式

#### adapters/

包含针对特定ORM的适配器实现。

主要文件：
- `drizzle-adapter.ts`: Drizzle ORM 适配器，将通用表结构转换为 Drizzle 特定的表结构

### 4. 模块导出

#### index.ts

导出模块的公共API，包括类型定义、单例实例和工具函数。

主要导出：
- 类型定义
- 数据库类型
- 版本管理相关
- 表转换器
- 单例实例（schemaRegistry, versionManager）

## 使用流程

1. 在 `definitions/` 目录下定义表结构
2. 在 `versions.ts` 中添加新版本的升级语句
3. 使用 `VersionManager` 管理数据库版本升级
4. 使用 `SchemaRegistry` 获取表结构定义
5. 使用 `TableConverter` 或特定适配器将表结构转换为ORM格式
6. 使用 `EntityConverter` 处理实体数据与数据库记录的转换

## 最佳实践

- 遵循 `definitions/README.md` 中的表结构定义指南
- 每次修改表结构时，在 `versions.ts` 中添加新版本
- 使用单例实例 `schemaRegistry` 和 `versionManager` 进行操作
- 使用适当的转换器和适配器处理数据转换

## 字段同步与一致性原则

### 类型定义与 Schema 字段一一对应

- 所有 User 类型（user.types.ts）中声明的字段（包括可选字段），都必须在 user-schema.ts 的 columns 中声明，字段名、类型需严格一致。
- mock 数据、测试数据、实际业务插入的数据字段，也必须与 schema 字段完全一致，否则 SQLite/ORM 会报“no column named ...”错误。

### 字段类型对应关系示例

| TypeScript 类型           | ColumnType         | 说明                 |
|--------------------------|--------------------|----------------------|
| string                   | STRING             | 字符串               |
| number                   | NUMBER             | 数值                 |
| boolean                  | BOOLEAN            | 布尔值               |
| Date/string (时间)       | DATETIME           | 日期时间             |
| Record/对象/数组         | JSON               | 结构化数据           |

### 常见字段补全清单（User 表）

- id: STRING, notNull: true, primaryKey: true
- name: STRING, notNull: true
- nickname: STRING, notNull: false
- email: STRING, notNull: false
- phone: STRING, notNull: false
- googleId: STRING, notNull: false
- avatar: STRING, notNull: false
- birthDate: STRING, notNull: true
- birthTime: STRING, notNull: false
- bazi: JSON, notNull: false
- gender: STRING, notNull: true
- photos: JSON, notNull: false
- bio: STRING, notNull: false
- interests: JSON, notNull: false
- occupation: STRING, notNull: false
- education: STRING, notNull: false
- location: JSON, notNull: false
- preferences: JSON, notNull: false
- privacySettings: JSON, notNull: false
- notificationSettings: JSON, notNull: false
- securitySettings: JSON, notNull: false
- isVerified: BOOLEAN, notNull: false
- lastActive: DATETIME, notNull: false
- isOnline: BOOLEAN, notNull: false
- status: STRING, notNull: false
- unreadNotifications: NUMBER, notNull: false
- tags: JSON, notNull: false
- mbti: STRING, notNull: false
- ext: JSON, notNull: false
- createdAt: DATETIME, notNull: true
- updatedAt: DATETIME, notNull: true

> ⚠️ 若类型或 mock 数据中出现新字段，务必同步补充到 schema，否则 SQLite 建表/插入会报错。

## 实体数据转换说明

- entity-converter.ts 支持 DATETIME/JSON 字段的自动类型转换：
  - DATETIME 字段自动转为 Date 实例
  - JSON 字段自动 parse 为对象