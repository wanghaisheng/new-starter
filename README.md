# HeyTCM Vibe Coding Starter

文档和提示词驱动的 AI 辅助开发框架，用于快速构建现代化的 Web 和移动应用。

## 快速开始

1. 阅读 [Vibe Coding 开发指南](./vibe-coding-guide.md) 了解如何使用这个框架
2. 查看 [项目文档索引](./docs/index.md) 获取完整的文档列表
3. 参考 [贡献指南](./CONTRIBUTION.md) 了解如何参与项目

## 核心特性

- **文档驱动开发**：基于文档和提示词的 AI 辅助开发流程
- **全栈解决方案**：集成了前端、移动端和数据库的完整技术栈
- **渐进式开发**：支持从 Mock 数据到生产环境的平滑过渡
- **跨平台支持**：同时支持 Web 和移动端（iOS/Android）开发
- **离线优先**：内置完善的离线存储和同步机制
- **测试驱动**：完整的测试框架和离线测试支持

## 项目结构

```
.
├── docs/                # 项目文档
│   ├── guides/         # 开发指南
│   ├── templates/      # 文档模板
│   └── index.md        # 文档索引
├── src/                # 源代码
│   ├── app/           # Next.js 应用
│   ├── core/          # 核心功能
│   └── components/    # 共享组件
├── scripts/            # 工具脚本
├── vibe-coding-guide.md # Vibe Coding 开发指南
├── CONTRIBUTION.md     # 贡献指南
└── README.md          # 项目说明
```

## 环境要求

- Node.js (v16+)
- bun 或 yarn
- Git

## 开始使用

1. 克隆仓库:
   ```bash
   git clone https://github.com/your-org/heytcm.git
   cd heytcm/new-starter
   ```

2. 安装依赖:
   ```bash
   bun install
   # 或
   yarn install
   ```

3. 运行开发服务器:
   ```bash
   bun run dev
   # 或
   yarn dev
   ```

4. 构建移动应用:
   ```bash
   # Android
   bun run build:android && bunx cap open android
   
   # iOS
   bun run build:ios && bunx cap open ios
   ```

## 开发进度

项目当前完成度：97%

### 已完成功能

- ✅ 移动端UI组件开发
- ✅ 数据库配置与实现
- ✅ 页面实现
- ✅ 测试与优化
- ✅ 文档与知识库
- ✅ 图片资源管理
- ✅ 离线功能支持

### 进行中功能

- ⏳ 移动应用打包与发布

## 文档资源

- [Vibe Coding 开发指南](./vibe-coding-guide.md)
- [项目文档索引](./docs/index.md)
- [贡献指南](./CONTRIBUTION.md)
- [技术栈说明](./docs/guides/tech-stack.md)
- [开发流程指南](./docs/guides/development-process-guide.md)
- [数据库开发指南](./docs/guides/database-development-workflow.md)

## 许可证

MIT 