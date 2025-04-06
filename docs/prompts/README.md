# AI 提示词库

本目录包含在开发过程中可能用到的各种提示词模板，用于指导 AI 助手完成特定任务。这些模板基于 HeyTCM Vibe Coding Starter 的最佳实践和架构设计。

## 项目文档参考

在使用这些提示词模板时，请参考以下项目文档：

- [项目初始化指南](./../guides/project-initialization-guide.md)
- [开发流程指南](./../guides/development-process-guide.md)
- [数据库开发工作流程](./../guides/database-development-workflow-updated.md)
- [导入路径规范](./../guides/import-path-standards.md)
- [最佳实践](./../guides/best-practices.md)

## 目录结构

```
prompts/
├── README.md                 # 本文件
├── development/             # 开发相关提示词
│   ├── code-review.md      # 代码审查提示词
│   ├── testing.md          # 测试相关提示词
│   └── debugging.md        # 调试相关提示词
├── database/               # 数据库相关提示词
│   ├── schema-design.md    # 数据库设计提示词
│   ├── query-optimization.md # 查询优化提示词
│   └── migration.md        # 数据迁移提示词
├── ui/                     # UI 相关提示词
│   ├── component-design.md # 组件设计提示词
│   ├── responsive-design.md # 响应式设计提示词
│   └── accessibility.md    # 无障碍设计提示词
└── documentation/          # 文档相关提示词
    ├── api-docs.md        # API 文档提示词
    ├── user-guide.md      # 用户指南提示词
    └── technical-docs.md  # 技术文档提示词
```

## 使用说明

1. 根据任务类型选择合适的提示词模板
2. 参考项目文档中的最佳实践和架构设计
3. 根据具体需求修改模板中的占位符
4. 将修改后的提示词提供给 AI 助手
5. 根据 AI 的响应进行必要的调整和迭代

## 提示词编写原则

1. **一致性**：遵循项目文档中的最佳实践和架构设计
2. **明确性**：清晰描述任务目标和期望结果
3. **上下文**：提供足够的背景信息和约束条件
4. **结构化**：使用清晰的格式和层次结构
5. **可复用**：设计通用的模板，便于重复使用
6. **可扩展**：预留修改和调整的空间

## 贡献指南

欢迎贡献新的提示词模板或改进现有模板。提交时请遵循以下格式：

1. 在相应目录下创建新的 Markdown 文件
2. 使用清晰的标题和分类
3. 引用相关的项目文档
4. 提供使用示例和预期结果
5. 说明适用场景和注意事项

## 模板使用示例

### 数据库开发

```markdown
请参考[数据库开发工作流程](./../guides/database-development-workflow-updated.md)文档，设计以下数据库模式：

1. 数据模型设计
2. 存储策略选择
3. 同步机制设计
4. 性能优化方案
5. 安全设计

数据库信息：
- 系统名称：[系统名称]
- 数据规模：[规模描述]
- 性能要求：[性能指标]
- 安全级别：[安全级别]

设计要求：
- 遵循项目的数据演进策略
- 支持多环境数据存储
- 实现离线优先策略
- 确保数据同步机制
``` 