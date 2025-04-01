# 项目文档索引

本文档提供了项目中所有文档的索引，帮助开发者快速找到所需的文档。

## 项目指南

- [项目初始化指南](./project-initialization-guide.md) - 项目初始化的步骤和说明
- [开发流程指南](./development-process-guide.md) - 项目开发流程的说明
- [Git分支策略](./git-branch-strategy.md) - 项目Git分支策略的说明
- [导入路径规范](./guides/import-path-standards.md) - 规定使用 @/ 前缀绝对路径而非相对路径的导入规范
- [导入路径实施细节](./guides/import-path-enforcement-implementation.md) - 详细说明导入路径规范的实施措施和工具

## 模板文档

- [应用发布工作流程](./templates/app-release-workflow.md) - 本文档详细说明了从开发完成到应用发布的完整流程，包括Web版本和移动应用(iOS/Android)的发布步骤。
- [编码规范与最佳实践](./templates/coding-standards.md) - 本文档定义了项目的编码规范和最佳实践，确保团队成员在开发过程中遵循一致的编码风格，提高代码质量和可维护性。
- [数据库开发工作流程](./templates/database-development-workflow.md) - 本文档详细说明了从Mock数据到本地数据库再到生产环境数据库的渐进式开发流程，确保数据结构在各环境中保持一致性。
- [Feature Task Plan Template](./templates/feature-task-plan-template.md) - ## 基本信息
- [项目开发工作流程](./templates/project-development-workflow.md) - 本文档详细说明了项目开发的完整工作流程，包括功能规划、任务拆解、开发过程和文档更新等环节。
- [UI素材管理指南](./templates/ui-assets-management.md) - 本文档提供了项目中UI设计稿素材管理的最佳实践，特别是关于图标和图片资源的处理流程。

## 任务脚本

- [`check-environment.sh`](./tasks/check-environment.sh) -检查项目环境是否已正确初始化
- [`check-minimal-env.sh`](./tasks/check-minimal-env.sh) -检查项目是否可以正常运行的最小要求
- [`check-project-status.sh`](./tasks/check-project-status.sh) -检查项目的当前状态并生成状态报告
- [`commit-code.sh`](./tasks/commit-code.sh) -规范代码提交流程
- [`create-docs-index.sh`](./tasks/create-docs-index.sh) -创建项目文档的索引，帮助开发者快速找到所需的文档
- [`create-mobile-pages.sh`](./tasks/create-mobile-pages.sh) -创建移动端的基本页面结构
- [`fix-dependencies.sh`](./tasks/fix-dependencies.sh) -用于修复依赖安装过程中的常见问题
- [`init-git-repo.sh`](./tasks/init-git-repo.sh) -初始化Git仓库并创建必要的分支
- [`init-project.sh`](./tasks/init-project.sh) -创建基础项目结构和配置文件
- [`install-dependencies.sh`](./tasks/install-dependencies.sh) -安装项目所需的依赖
- [`prepare-release.sh`](./tasks/prepare-release.sh) -检查发布前的必要条件并准备发布环境
- [`release.sh`](./tasks/release.sh) -执行应用的发布过程
- [`rollback.sh`](./tasks/rollback.sh) -在发布出现严重问题时执行回滚操作
- [`setup-python-env.sh`](./tasks/setup-python-env.sh) -创建并配置Python虚拟环境，安装项目所需的Python依赖
- [`update-project-progress.sh`](./tasks/update-project-progress.sh) -用于记录项目的当前状态和完成的任务
- [`update-project-rules.sh`](./tasks/update-project-rules.sh) -更新项目的规则文件，确保它包含所有必要的规则和指南

## 项目状态

- [项目进度报告](./project-progress.md) - 项目的当前进度和完成的任务
- [项目状态报告](./project-status.md) - 项目的当前状态和检查结果

## 其他文档

- [项目工具使用指南](./tools-usage-guide.md)

## 使用指南

1. 在开始开发前，请先阅读[项目初始化指南](./project-initialization-guide.md)和[开发流程指南](./development-process-guide.md)
2. 创建新功能时，请使用[功能任务计划模板](./templates/feature-task-plan-template.md)
3. 提交代码时，请使用[`commit-code.sh`](./tasks/commit-code.sh)脚本
4. 发布应用时，请遵循[应用发布工作流程](./templates/app-release-workflow.md)
5. 定期运行[`check-project-status.sh`](./tasks/check-project-status.sh)检查项目状态
6. 定期运行[`update-project-progress.sh`](./tasks/update-project-progress.sh)更新项目进度
