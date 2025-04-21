# 项目目录结构说明

```
.
├── app/                  # Web/移动端页面与API目录（Next.js风格，含web、mobile、api子目录）
│   ├── (web)/            # Web端页面与组件
│   ├── mobile/           # 移动端页面与业务模块
│   └── api/              # API路由与接口实现
├── src/
│   ├── core/
│   │   ├── components/   # 业务通用组件
│   │   ├── hooks/        # 业务逻辑Hooks（如useUser、useMatches等）
│   │   ├── lib/          # 底层库/工具
│   │   ├── services/     # 业务服务层（分business、data、infrastructure等子层）
│   │   └── store/        # 状态管理
│   ├── assets/           # 静态资源
│   ├── mobile/           # 移动端相关代码
│   ├── mock/             # Mock及测试用例
│   ├── providers/        # 全局Provider
│   ├── styles/           # 样式
│   ├── types/            # 类型定义
│   ├── utils/            # 工具方法
│   └── web/              # Web端相关代码
├── public/               # 公共静态资源
├── docs/                 # 项目文档与知识库
│   ├── guides/           # 指南与规范
│   ├── issues/           # 典型问题
│   ├── prompts/          # AI/对话模板
│   └── ...
├── new-docs/             # 自动生成/增量补充文档
│   └── app/              # 各类App分析提示词模板
├── tasks/                # 任务、测试计划与推进
├── testing/              # 测试相关文件
├── scripts/              # 自动化脚本
├── tools/                # 工具代码
├── capacitor/            # 移动端适配配置
├── package.json          # 依赖与脚本
├── README.md             # 项目说明
├── next.config.js        # Next.js配置
├── tsconfig.json         # TypeScript配置
└── ...
```

## 主要目录说明
- **app/**：Web与移动端页面、API接口统一入口，支持多端协同开发。
- **src/core/**：核心业务逻辑，包括组件、hooks、服务、底层库等，分层清晰，便于维护和扩展。
- **docs/**：各类开发文档、架构说明、最佳实践、问题解决方案等。
- **new-docs/**：自动生成的结构化文档与分析模板，便于团队持续补充。
- **tasks/**、**testing/**：任务管理、测试计划与推进、测试用例。
- **public/**、**assets/**：静态资源归档，便于前后端/多端复用。
- **scripts/**、**tools/**：自动化脚本与工具代码。
- **capacitor/**：移动端适配与插件配置。

如需详细了解某一子目录或模块，请查阅对应目录下的README或相关文档。
