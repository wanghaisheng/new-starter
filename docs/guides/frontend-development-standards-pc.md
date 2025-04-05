# PC端前端开发规范

## 1. 技术栈

- **框架**: Next.js
- **UI库**: 第三方组件库（如Material UI, Chakra UI, Ant Design等）
- **样式**: TailwindCSS + CSS Modules
- **状态管理**: React Context + Zustand
- **数据请求**: React Query/SWR
- **表单管理**: React Hook Form + Zod
- **类型检查**: TypeScript

## 2. 项目目录结构

```
app/                     # Next.js App Router (PC端)
├── (web)/               # Web专属路由
│   ├── page.tsx         # Web首页
│   ├── layout.tsx       # Web布局
│   └── [...其他页面]/    # 其他Web页面
└── api/                 # API路由

src/
├── assets/              # 静态资源
│   ├── locales/         # 国际化资源文件
│   └── images/          # 图片资源
├── core/                # 共享核心
│   ├── hooks/           # 共享Hooks
│   ├── lib/             # 核心库
│   │   ├── db/          # 数据库访问层
│   │   ├── i18n/        # 国际化核心
│   │   └── api/         # API客户端
│   └── models/          # 数据模型
├── web/                 # Web特定
│   ├── components/      # Web特定组件
│   │   ├── layout/      # 布局组件
│   │   ├── ui/          # UI组件
│   │   ├── forms/       # 表单组件
│   │   └── features/    # 功能组件
│   └── utils/           # Web特定工具
├── providers/           # 全局Providers
├── styles/              # 全局样式
└── utils/               # 通用工具
```

## 3. 组件开发规范

### 3.1 组件结构

所有组件应遵循以下结构:

```tsx
// src/web/components/ui/Button.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/core/lib/i18n';
import type { ButtonProps } from '@/web/components/ui/types';

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const t = useI18n();
  
  return (
    <button 
      className={twMerge(
        // 基础样式
        'px-4 py-2 rounded-lg font-medium',
        // 变体样式
        variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        // 自定义样式
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? t(children) : children}
    </button>
  );
}
```

### 3.2 组件规范

1. **命名规范**
   - 组件文件名采用PascalCase: `Button.tsx`
   - 组件名采用PascalCase: `Button`
   - 钩子名采用camelCase并以use开头: `useFormData`

2. **导入路径**
   - 必须使用绝对路径: `import { Button } from '@/web/components/ui/Button';`
   - 禁止使用相对路径: `import { Button } from '../../components/ui/Button';`

3. **Props定义**
   - 使用TypeScript接口定义Props
   - 为可选Props提供默认值
   - 使用解构获取Props

4. **样式管理**
   - 优先使用Tailwind CSS类
   - 使用`twMerge`或`clsx`合并样式类
   - 复杂样式可使用CSS Modules

## 4. 页面开发规范

### 4.1 基本页面结构

```tsx
// app/(web)/dashboard/page.tsx
import { DashboardHeader } from '@/web/components/features/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/web/components/features/dashboard/DashboardSidebar';
import { DashboardContent } from '@/web/components/features/dashboard/DashboardContent';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
```

### 4.2 数据获取

```tsx
// app/(web)/dashboard/page.tsx
import { Suspense } from 'react';
import { DashboardContent } from '@/web/components/features/dashboard/DashboardContent';
import { DashboardSkeleton } from '@/web/components/features/dashboard/DashboardSkeleton';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

// src/web/components/features/dashboard/DashboardContent.tsx
import { use } from 'react';
import { getDashboardData } from '@/core/lib/api/dashboard';

export function DashboardContent() {
  const data = use(getDashboardData());
  
  return (
    <div>
      {/* 渲染数据 */}
    </div>
  );
}
```

## 5. 状态管理规范

### 5.1 状态选择指南

| 状态类型 | 推荐方案 | 使用场景 |
|---------|---------|---------|
| 组件内部状态 | useState | 简单的UI状态 |
| 共享状态 | useContext + useReducer | 跨组件共享状态 |
| 复杂状态 | Zustand/Jotai | 全局状态管理 |
| 服务端状态 | React Query/SWR | 数据获取和缓存 |

### 5.2 Zustand全局状态示例

```tsx
// src/web/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/core/lib/db/models/user';
import { AuthService } from '@/core/lib/api/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await AuthService.login(email, password);
          set({ user, isLoading: false });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      },
      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
          set({ user: null, isLoading: false });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

## 6. 表单处理规范

### 6.1 React Hook Form + Zod示例

```tsx
// src/web/components/forms/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/web/components/ui/Button';
import { Input } from '@/web/components/ui/Input';
import { useAuthStore } from '@/web/stores/auth-store';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = handleSubmit(async (data) => {
    await login(data.email, data.password);
  });
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Input
          label="邮箱"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <Input
          label="密码"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
      </div>
      
      {error && (
        <div className="text-red-500">{error.message}</div>
      )}
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </Button>
    </form>
  );
}
```

## 7. 国际化规范

```tsx
// src/core/lib/i18n/index.ts
import { useTranslations } from 'next-intl';

export function useI18n() {
  return useTranslations('common');
}

// 使用示例
// src/web/components/ui/WelcomeMessage.tsx
import { useI18n } from '@/core/lib/i18n';

export function WelcomeMessage() {
  const t = useI18n();
  
  return (
    <h1>{t('welcome')}</h1>
  );
}
```

## 8. API交互规范

### 8.1 使用React Query

```tsx
// src/web/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/core/lib/api/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });
}

// 使用示例
// src/web/components/features/UserList.tsx
import { useUsers } from '@/web/hooks/useUsers';

export function UserList() {
  const { data, isLoading, error } = useUsers();
  
  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>出错了: {error.message}</div>;
  
  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 9. 性能优化

1. **组件优化**
   - 使用`useMemo`和`useCallback`优化计算和回调
   - 使用`memo`避免不必要的渲染
   - 按需加载组件: `const DynamicComponent = dynamic(() => import('./Component'))`

2. **数据获取优化**
   - 使用React Query/SWR进行缓存
   - 使用Next.js的ISR/SSG预渲染

3. **资源优化**
   - 使用Next.js的Image组件优化图片
   - 使用字体优化和代码分割

## 10. 测试规范

1. **单元测试**
   - 使用Jest + React Testing Library
   - 测试文件命名: `Component.test.tsx`

2. **集成测试**
   - 使用Cypress进行端到端测试
   - 测试主要用户流程

## 11. 代码质量规范

1. **ESLint规则**
   - 使用项目根目录的`.eslintrc.js`配置
   - 遵循airbnb规则集

2. **Prettier规则**
   - 使用项目根目录的`.prettierrc.js`配置
   - 代码提交前格式化

3. **TypeScript规则**
   - 按照`tsconfig.json`配置进行开发
   - 禁止使用`any`类型

4. **提交规范**
   - 使用husky + commitlint
   - 提交信息格式: `type(scope): message` 