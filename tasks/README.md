# 任务文档管理指南

## 文档索引

请参考 [任务索引文件](./index.md) 获取项目所有任务的完整列表和链接，包括：
- 移动前端开发任务
- 数据库开发任务
- 应用开发任务
- 测试任务
- 项目管理任务

## 文件组织策略

任务文档按照以下结构组织：

```
tasks/
├── README.md                         # 本指南文档
├── index.md                          # 任务索引文件，所有任务的入口
├── mobile-frontend/                  # 移动前端开发任务
│   ├── README.md                     # 移动前端任务说明
│   ├── mobile-frontend-data-plan.md  # 移动前端与数据任务计划
│   └── mobile-frontend-data-progress.md # 移动前端与数据任务进度
├── database/                         # 数据库开发任务
│   ├── README.md                     # 数据库任务说明
│   ├── database-implementation-plan.md # 数据库实施计划
│   └── db-refactor/                  # 数据库重构相关文档
├── app-development/                  # 应用开发任务
│   ├── README.md                     # 应用开发任务说明
│   └── tinder-app-starter/           # Tinder应用初始文档
├── testing/                          # 测试任务
│   ├── README.md                     # 测试任务说明
│   ├── mobile-testing-progress.md    # 移动测试进度
│   └── test-summary.md               # 测试摘要
├── project-management/               # 项目管理任务
│   ├── README.md                     # 项目管理任务说明
│   └── project-progress.md           # 项目总体进度
└── old/                              # 已完成或存档的任务文档
```

## 文件命名规范

为确保任务文档的一致性和可追溯性，我们采用以下命名规范：

### 任务计划文档

格式：`{module}-{task-type}-plan.md`

示例：
- `mobile-frontend-data-plan.md` - 移动端前端与数据模块任务计划
- `database-implementation-plan.md` - 数据库实现任务计划

### 任务进度文档

格式：`{module}-{task-type}-progress.md`

示例：
- `mobile-frontend-data-progress.md` - 移动端前端与数据模块任务进度
- `database-implementation-progress.md` - 数据库实现任务进度

### 已完成或存档的任务文档

已完成或存档的任务文档应移至 `old` 子目录，并可选择添加日期后缀：

格式：`old/{module}-{task-type}-{status}-{YYYY-MM-DD}.md`

示例：
- `old/mobile-frontend-data-completed-2023-04-10.md`
- `old/database-implementation-archived-2023-04-05.md`

## 任务跟踪机制

### 任务状态标记

在任务文档中使用以下标记表示任务状态：

- `[ ]` 或 `⏳` - 待办任务
- `[x]` 或 `✅` - 已完成任务
- `[~]` 或 `🔄` - 进行中任务
- `[!]` 或 `⚠️` - 阻塞或有风险的任务
