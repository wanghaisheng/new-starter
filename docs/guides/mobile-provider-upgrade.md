# app/mobile 端 Provider 体系升级改造计划

## 目标
- 全面接入新版 Provider（MessageProvider、MatchProvider、NotificationProvider、ThemeProvider、PermissionProvider 等），保证 hooks、服务实例注入、全局状态一致性。
- 移动端与 Web 端共享同一套服务注入和全局状态管理体系，便于维护、mock、扩展。

---

## 一、改造范围

- 入口文件：`app/mobile/layout.tsx`、`app/mobile/page.tsx` 及所有子页面。
- Provider 体系：`src/providers/MessageProvider.tsx`、`MatchProvider.tsx`、`NotificationProvider.tsx`、`ThemeProvider.tsx`、`PermissionProvider.tsx` 及组合导出文件。
- 相关 hooks：所有业务 hooks（useMessages、useMatches、useNotifications、useTheme、usePermission 等）。

---

## 二、主要步骤

1. **Provider 统一导入与组合**
   - 在 `src/providers/index.tsx` 或 `src/providers/ionic/index.tsx` 统一组合所有 Provider，导出 `AppProviders` 组件。

2. **移动端入口包裹 Provider**
   - 在 `app/mobile/layout.tsx` 用 `AppProviders` 包裹页面内容。
   - 示例：
     ```tsx
     import { AppProviders } from '@/src/providers';
     export default function MobileLayout({ children }) {
       return (
         <AppProviders>
           {children}
         </AppProviders>
       );
     }
     ```

3. **页面/组件全部走 hooks 获取服务**
   - 检查所有 `app/mobile` 下页面、组件，禁止直接 new/factory/service，全部通过 hooks（如 useMessageService/useMatchService/useNotificationService/useTheme/usePermission）获取服务和状态。
   - 如有遗留代码直接实例化服务，统一重构为 hooks 调用。

4. **测试与验证**
   - 编写/补充单元测试，mock Provider 注入，验证移动端页面 hooks 能正确消费服务实例。
   - 验证主题、权限等全局状态切换在移动端生效。

5. **文档与最佳实践**
   - 在 `docs/guides/hooks-best-practices.md`、`docs/guides/mobile-provider-upgrade.md` 补充本次改造说明与使用示例。

---

## 三、注意事项

- 保持 hooks、Provider 命名、注入方式与 Web 端一致，便于复用和维护。
- 如需 mock 或多环境切换，只需替换 Provider 实现。
- 权限、主题等 Provider 可按需扩展（如 SSR 支持、持久化等）。

---

## 四、里程碑与检查点

- [ ] 入口 Provider 组合与导入完成
- [ ] layout.tsx 包裹 Provider
- [ ] 页面/组件全部用 hooks 获取服务
- [ ] 测试用例通过
- [ ] 文档补充与团队同步

---

负责人：@yourname
计划时间：2025-04-21
进度跟踪：见 issue #mobile-provider-upgrade
