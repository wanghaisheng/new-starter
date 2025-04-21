# 全局路由登录守卫与公开页面集中配置实践

本项目采用集中式路由守卫方案，统一管理哪些页面需要登录、哪些页面可公开访问，极大提升了安全性与维护效率。

## 实现方式概述

- 在 `app/mobile/layout.tsx` 中统一引入 `useRequireAuth`。
- 通过 `PUBLIC_ROUTES` 白名单数组集中配置所有无需登录的页面路径。
- 所有未列入白名单的页面自动应用登录守卫，未登录用户会被重定向到登录页。
- 只需维护一份路径列表，无需每个页面单独加/删 useRequireAuth。

## 代码示例

```tsx
// app/mobile/layout.tsx
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { usePathname } from 'next/navigation';

// 公开页面白名单
const PUBLIC_ROUTES = [
  '/mobile/onboard',
  '/mobile/page',
  '/mobile/auth/login',
  '/mobile/auth/register',
  '/mobile/auth/phone',
  // 如有其它公开页面请补充
];

export default function MobileLayout({ children }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  if (!isPublic) {
    useRequireAuth();
  }
  return <>{children}</>;
}
```

## 维护说明

- 公开页面仅需在 `PUBLIC_ROUTES` 中添加路径即可。
- 新增页面时，若需公开访问，务必同步维护该列表。
- 其余页面将自动强制登录，保障数据与用户安全。

## 优势
- **集中管理**：无需每页重复加守卫，统一维护更高效。
- **易于扩展**：如需支持正则、黑名单机制等可进一步扩展。
- **安全性高**：所有未列入白名单的页面均强制登录。

## 适用范围
- 推荐所有 mobile 端页面均通过该方式进行访问控制。
- web 端、管理后台等亦可采用类似集中式守卫策略。

---
如需调整守卫逻辑或有更复杂的访问控制需求，请在此文档补充说明并同步团队。
