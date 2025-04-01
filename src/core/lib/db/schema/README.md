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