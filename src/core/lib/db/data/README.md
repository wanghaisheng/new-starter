# 数据注入与 mock 数据管理

本目录用于集中管理所有开发阶段（mock、dev、prod/init）所需的业务与配置 mock 数据，支持灵活的数据注入和分阶段数据组织。

## 目录结构建议

```
src/core/lib/db/data/
├── mock/           # mock 阶段专用数据
│   ├── user.mock.ts
│   ├── message.mock.ts
│   └── ...
├── dev/            # 开发阶段专用数据（如演示数据、测试账号等）
│   ├── user.dev.ts
│   └── ...
├── prod-init/      # 生产环境初始化数据（如系统配置、默认参数等）
│   ├── config.prod.ts
│   └── ...
├── index.ts        # 数据注入统一入口（按环境导出/注入）
└── README.md       # 说明文档
```

## 推荐用法
- 每类数据（如 user、message、config）单独一个 mock/dev/prod-init 文件，导出数组或对象。
- `index.ts` 统一导入所有 mock/dev/prod-init 数据，并提供按环境的数据初始化接口。
- mock 阶段自动注入 mock 数据，dev 阶段可选注入演示数据，prod 阶段仅注入核心配置数据。

## 初始化示例

```typescript
// src/core/lib/db/data/index.ts
import { userMockData } from './mock/user.mock';
import { userDevData } from './dev/user.dev';
import { configProdData } from './prod-init/config.prod';

export function getDataForEnv(env: 'mock' | 'dev' | 'prod-init') {
  if (env === 'mock') return { user: userMockData };
  if (env === 'dev') return { user: userDevData };
  if (env === 'prod-init') return { config: configProdData };
  return {};
}
```

## 优势
- mock、dev、prod-init 数据完全隔离，切换灵活。
- 支持批量导入、类型安全、集中维护。
- 便于 CI、自动化测试、演示环境、生产初始化等多场景。

---
如需批量生成 mock/dev/prod-init 数据模板或自动注入脚本，可随时提出！
