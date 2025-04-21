# src/mobile/components 目录说明

本目录用于存放**移动端专属组件**，仅在移动端（如 app/mobile 下页面）使用，适配移动端交互和视觉规范。

## 目录定位
- **仅限移动端专属 UI 组件**：如 BottomNavBar、移动端专用导航栏、手势滑动、原生交互等。
- **不包含通用/跨端组件**：如消息输入框、聊天气泡、通用卡片等，已迁移至 `src/core/components`，请统一从 core 层 import。
- **业务复用组件优先放 core**：如后续有 web/mobile 需共用的 UI 组件，请直接放在 core/components，并在此文档和前端结构文档中标注。

## 组件迁移与维护规范
- **迁移原则**：如组件有 web/mobile 复用需求，优先迁移至 core/components，并删除本目录冗余实现。
- **专属组件保留**：如 BottomNavBar 等仅移动端使用的组件，继续在本目录维护。
- **目录结构建议**：按业务或功能分子目录，如 navigation/、cards/、matches/ 等。

## 典型组件举例
- `navigation/BottomNavBar.tsx`：移动端底部导航栏，仅在 app/mobile 下页面引用。
- 其它如 SwipeCard、手势导航等，也可根据是否复用决定是否迁移。

## import 路径规范
- 移动端专属组件：`@/mobile/components/xxx`
- 通用组件：`@/core/components/xxx`

## 相关文档
- 组件目录与迁移说明详见 docs/guides/development/frontend/frontend-components-structure.md
- 组件导入路径规范见 docs/guides/import-path-standards.md

如有组件迁移、目录结构优化等建议，请在本文件补充说明并同步到团队文档。