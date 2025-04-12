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
- **环境感知**：智能的环境配置和数据库客户端管理

## 环境配置

项目支持三种环境配置：

### 1. Mock 环境
用于开发和测试，使用模拟数据：
```bash
# 开发
bun run dev:mock

# 构建
bun run build:mock

# 测试
bun run test:mock

# 环境检查
bun run check:env:mock
```

### 2. 开发环境
用于本地开发，使用本地数据库：
```bash
# 开发
bun run dev:dev

# 构建
bun run build:dev

# 测试
bun run test:dev

# 环境检查
bun run check:env:dev
```

### 3. 生产环境
用于生产部署，使用生产数据库：
```bash
# 开发
bun run dev:prod

# 构建
bun run build:prod

# 测试
bun run test:prod

# 环境检查
bun run check:env:prod

# 部署
bun run deploy:prod
```

## 内存管理

Mock 环境可能需要更多内存来处理模拟数据。如果遇到内存不足错误，可以：

1. 增加 Node.js 内存限制：
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096

# Linux/Mac
export NODE_OPTIONS=--max-old-space-size=4096
```

2. 清理缓存：
```bash
# 清理 Next.js 缓存
rm -rf .next

# 清理 node_modules
rm -rf node_modules
bun install
```

3. 使用开发模式：
```bash
# 使用开发模式运行，减少内存使用
bun run dev:mock --no-cache
```

## 项目结构

```
.
├── app/                # Next.js 应用
│   ├── mobile/        # 移动端页面
│   ├── api/           # API 路由
│   ├── (web)/         # Web 页面
│   ├── layout.tsx     # 根布局
│   └── page.tsx       # 首页
├── src/               # 源代码
│   ├── core/         # 核心功能
│   │   └── lib/      # 核心库
│   ├── components/   # 共享组件
│   ├── providers/    # 上下文提供者
│   ├── utils/        # 工具函数
│   ├── lib/          # 库文件
│   ├── mock/         # Mock 数据
│   ├── test/         # 测试文件
│   ├── assets/       # 静态资源
│   ├── types/        # 类型定义
│   ├── web/          # Web 相关代码
│   ├── styles/       # 样式文件
│   └── mobile/       # 移动端相关代码
├── docs/             # 项目文档
│   ├── guides/      # 开发指南
│   ├── templates/   # 文档模板
│   └── index.md     # 文档索引
├── scripts/          # 工具脚本
├── vibe-coding-guide.md # Vibe Coding 开发指南
├── CONTRIBUTION.md   # 贡献指南
└── README.md        # 项目说明
```

## 环境要求

- Node.js (v16+)
- bun 或 yarn
- Git
- Capacitor (用于移动端开发)
- 建议内存：8GB+ (Mock 环境需要更多内存)

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
   # Mock 环境
   bun run dev:mock
   
   # 开发环境
   bun run dev:dev
   
   # 生产环境
   bun run dev:prod
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
- ✅ 环境感知数据库客户端

### 进行中功能

- ⏳ 移动应用打包与发布

## 文档资源

- [Vibe Coding 开发指南](./vibe-coding-guide.md)
- [项目文档索引](./docs/index.md)
- [贡献指南](./CONTRIBUTION.md)
- [技术栈说明](./docs/guides/tech-stack.md)
- [开发流程指南](./docs/guides/development-process-guide.md)
- [数据库开发指南](./docs/guides/database-development-workflow.md)
- [环境配置指南](./docs/guides/environment-configuration.md)

## 许可证

MIT 