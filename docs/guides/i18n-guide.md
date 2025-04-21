# I18n（多语言）最佳实践与实现指南

> 本文档系统梳理本项目多语言（I18n）实现的架构、用法、mock 数据、自动化流程及前后端协作规范，适用于所有业务线及开发成员。

---

## 1. 架构与技术栈

- **多语言服务分层**：采用 Adapter + Service + Registry + Factory 设计，支持 mock、remote、hybrid 多源切换。
- **核心依赖**：TypeScript、Next.js、React、Capacitor、IndexedDB/SQLite、SWR、定制 hooks。
- **mock 数据集中管理**：所有 mock 多语言内容统一存放于 `src/core/services/infrastructure/config/types/translation.mock.ts`。
- **自动化提取与替换**：支持自动扫描页面源码提取硬编码文本，批量生成/补全 translation.mock.ts，并可自动替换为 useTranslations/t(key) 调用。

---

## 2. 多语言内容来源与处理方式

### 2.1 界面/标签类文案
- 所有页面、组件、弹窗、表单、按钮等 UI 文案**必须走多语言 key**，严禁硬编码。
- 推荐用法：
  ```tsx
  import { useTranslations } from '@/core/hooks/useTranslations';
  const { get } = useTranslations(['page.home.title']);
  <h1>{get('page.home.title')}</h1>
  ```
- 支持批量 key 注册和自动 mock 补全。

### 2.2 业务数据多语言
- 后台返回业务数据（如礼物、标签、活动等），推荐结构：
  ```json
  {
    "id": 1,
    "nameI18n": { "zh": "玫瑰花", "en": "Rose" }
  }
  ```
- 前端通过 `item.nameI18n[locale] || item.nameI18n['zh']` 获取。
- 系统文案、动态配置等仍建议走 translation service。

### 2.3 后台动态内容
- remote adapter 支持对接后台 translations 表/API，支持内容运营和热更新。
- hybrid adapter 支持本地 mock fallback，开发/测试环境自动降级。

---

## 3. translation.mock.ts 维护与自动化

- 所有 mock 多语言内容集中于 `src/core/services/infrastructure/config/types/translation.mock.ts`，结构如下：
  ```ts
  {
    key: 'subscribe.monthly.title',
    locale: 'zh',
    value: '月度会员',
    type: 'system',
    updatedAt: new Date()
  }
  ```
- 支持自动化脚本：
  - 扫描 app 下所有页面，提取硬编码文本，自动生成/补全 mock key
  - 支持增量合并、去重、批量补全
  - 可自动替换页面源码为 useTranslations/t(key) 调用

---

## 4. hooks 用法与状态规范

- 统一通过 `useTranslations` 获取多语言内容，返回结构：
  ```ts
  {
    loading: boolean;
    error: Error | null | { type: string; message: string };
    empty: boolean;
    data: { [key: string]: string } | null;
    get: (key: string) => string;
    fetch: () => void;
  }
  ```
- 其它业务 hooks（useUser/useMatches/useMessages/useQuiz/useAuth等）均已统一 loading/error/empty 字段，异常处理细化，禁止 Factory 直连。

---

## 5. 前后端协作与最佳实践

- 后端推荐所有业务数据返回多语言字段（如 nameI18n），便于内容运营和批量管理。
- 系统/界面文案统一用 translation service 查 key，便于前端 mock、A/B、多端一致。
- translation service 支持 mock/remote/hybrid，自动适配多环境，支持 fallback。
- 推荐定期用自动化脚本提取/补全 translation.mock.ts，保证 key 全量覆盖。

---

## 6. 自动化脚本与CI集成建议

- 建议在 `scripts/dev/` 下维护 extract-i18n-and-replace.ts 脚本：
  - 一键扫描 app 下源码，提取硬编码文本，生成/补全 translation.mock.ts
  - 支持 dry-run/实际替换，安全可控
  - 可集成到 CI 检查流程，保证多语言 key 覆盖率

---

## 7. 常见问题与FAQ

- Q: 如何新增多语言 key？
  A: 直接在页面用 useTranslations/t(key)，脚本会自动补全 translation.mock.ts。
- Q: 业务数据 nameI18n 缺失语言怎么办？
  A: 建议后端补全，前端可 fallback 到 zh。
- Q: 如何支持新语言？
  A: translation.mock.ts 和 translations 表支持多 locale 扩展，脚本可自动补全。

---

## 8. 参考链接
- [Next.js 国际化官方文档](https://nextjs.org/docs/advanced-features/i18n-routing)
- [React 国际化最佳实践](https://react.i18next.com/)
- [TypeScript 多语言类型安全实践](https://github.com/i18next/i18next)

---

如有更多多语言/国际化需求，请联系架构负责人或提交 issue！
