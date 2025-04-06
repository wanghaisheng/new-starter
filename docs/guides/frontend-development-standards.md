# 前端开发规范

## 1. 项目结构

### 1.1 目录结构
```
src/
├── core/                 # 跨平台核心
│   ├── components/       # 共享UI组件
│   ├── hooks/           # 共享Hooks
│   ├── lib/             # 核心库
│   ├── models/          # 数据模型
│   ├── services/        # 核心服务
│   └── utils/           # 工具函数
├── mobile/              # 移动端特定
│   ├── components/      # 移动端组件
│   ├── layouts/         # 移动端布局
│   └── styles/          # 移动端样式
├── web/                 # PC端特定
│   ├── components/      # PC端组件
│   ├── layouts/         # PC端布局
│   └── styles/          # PC端样式
└── shared/              # 共享资源
    ├── assets/          # 静态资源
    ├── styles/          # 共享样式
    └── constants/       # 常量定义
```

## 2. 组件开发规范

### 2.1 组件结构
```typescript
// 组件目录结构
ComponentName/
├── index.tsx           # 组件主文件
├── styles.module.css   # 组件样式
├── types.ts           # 类型定义
└── __tests__/         # 测试文件
    └── index.test.tsx
```

### 2.2 组件实现
```typescript
// src/core/components/Button/index.tsx
import { FC } from 'react';
import styles from './styles.module.css';
import { ButtonProps } from './types';

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### 2.3 响应式设计
```typescript
// Tailwind响应式类使用
<div className="
  w-full                  // 移动端宽度
  md:w-2/3               // 平板宽度
  lg:w-1/2               // 桌面端宽度
  p-4                    // 移动端内边距
  md:p-6                 // 平板内边距
  lg:p-8                 // 桌面端内边距
">
```

## 3. 状态管理

### 3.1 React Context
```typescript
// src/core/contexts/UserContext.tsx
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
```

### 3.2 Hooks使用
```typescript
// src/core/hooks/useUser.ts
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

## 4. 路由管理

### 4.1 路由配置
```typescript
// app/routes.ts
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  // 动态路由
  user: (id: string) => `/users/${id}`,
  post: (id: string) => `/posts/${id}`,
};
```

### 4.2 路由守卫
```typescript
// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## 5. 移动端特定规范

### 5.1 触摸事件处理
```typescript
// src/mobile/components/SwipeCard.tsx
export const SwipeCard: FC<SwipeCardProps> = ({ onSwipe }) => {
  const handleTouchStart = (e: TouchEvent) => {
    // 处理触摸开始
  };

  const handleTouchMove = (e: TouchEvent) => {
    // 处理触摸移动
  };

  const handleTouchEnd = () => {
    // 处理触摸结束
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 卡片内容 */}
    </div>
  );
};
```

### 5.2 移动端适配
```typescript
// src/mobile/utils/viewport.ts
export const getViewportSize = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// 监听视口变化
window.addEventListener('resize', getViewportSize);
```

## 6. PC端特定规范

### 6.1 布局组织
```typescript
// src/web/layouts/DashboardLayout.tsx
export const DashboardLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
```

### 6.2 交互优化
```typescript
// src/web/components/DataTable/index.tsx
export const DataTable: FC<DataTableProps> = ({ data, columns }) => {
  const [sortField, setSortField] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>();

  const handleSort = (field: string) => {
    // 实现排序逻辑
  };

  return (
    <table>
      <thead>
        {columns.map(column => (
          <th
            key={column.field}
            onClick={() => handleSort(column.field)}
            className="cursor-pointer hover:bg-gray-50"
          >
            {column.title}
          </th>
        ))}
      </thead>
      <tbody>
        {/* 表格内容 */}
      </tbody>
    </table>
  );
};
```

## 7. 性能优化

### 7.1 组件优化
```typescript
// 使用React.memo优化组件重渲染
export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  ({ data }) => {
    return (
      // 组件实现
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### 7.2 图片优化
```typescript
// src/core/components/Image/index.tsx
import { useState } from 'react';
import NextImage from 'next/image';

export const Image: FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${isLoading ? 'animate-pulse' : ''}`}>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
};
```

## 8. 测试规范

### 8.1 组件测试
```typescript
// src/core/components/Button/__tests__/index.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../index';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button>Click me</Button>
    );
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 8.2 Hook测试
```typescript
// src/core/hooks/__tests__/useUser.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useUser } from '../useUser';

describe('useUser', () => {
  it('returns user context', () => {
    const wrapper = ({ children }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.user).toBeNull();
  });
});
```

## 9. 文档规范

### 9.1 组件文档
```typescript
/**
 * 按钮组件
 * @component
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   size="md"
 *   onClick={() => console.log('clicked')}
 * >
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'outline';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 点击事件处理函数 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}
```

### 9.2 工具函数文档
```typescript
/**
 * 格式化日期时间
 * @param date - 要格式化的日期
 * @param format - 格式化模式
 * @returns 格式化后的日期字符串
 * @example
 * ```ts
 * formatDateTime(new Date(), 'YYYY-MM-DD HH:mm:ss')
 * // => '2024-04-06 14:30:00'
 * ```
 */
export function formatDateTime(
  date: Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  // 实现代码
}
```
