# 前端开发规范

## 1. 项目目录结构规范

### 1.1 核心目录结构
```
app/                      # Next.js App Router
├── (mobile)/             # 移动端专属路由
│   ├── page.tsx          # 移动端首页
│   └── layout.tsx        # 移动端布局
├── (web)/                # Web专属路由
│   ├── page.tsx          # Web首页
│   └── layout.tsx        # Web布局
└── api/                  # API路由

src/
├── assets/               # 静态资源
│   ├── locales/          # 国际化资源文件
│   └── images/           # 图片资源
├── core/                 # 跨平台核心
│   ├── components/       # 共享UI组件
│   │   ├── ui/          # 纯Tailwind组件
│   │   ├── ionic/       # Ionic组件封装
│   │   └── hybrid/      # 混合组件
│   ├── hooks/           # 共享Hooks
│   ├── lib/             # 核心库
│   │   ├── db/          # 数据库访问层
│   │   ├── i18n/        # 国际化核心
│   │   └── api/         # API客户端
│   └── models/          # 数据模型
├── mobile/              # 移动端特定
│   ├── components/      # 原生增强组件
│   ├── plugins/         # Capacitor插件封装
│   └── utils/           # 移动端工具
├── web/                 # Web特定
│   ├── components/      # Web特定组件
│   └── utils/           # Web特定工具
├── providers/           # 全局Providers
├── styles/              # 全局样式
└── utils/               # 通用工具
```

### 1.2 组件开发规范

#### 1.2.1 共享组件开发
```typescript
// src/core/components/ui/Button.tsx
import React from 'react';
import { useI18n } from '@/core/lib/i18n';
import type { ButtonProps } from '@/core/components/ui/types';
import { twMerge } from 'tailwind-merge';

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
        variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark',
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

> **重要说明**: 所有导入应使用 `@/` 前缀的绝对路径，而非相对路径。请参阅[导入路径规范](./import-path-standards.md)了解详情。
```

#### 1.2.2 移动端组件开发
```typescript
// src/mobile/components/NativeButton.tsx
import { Capacitor } from '@capacitor/core';
import { Button } from '@/core/components/ui/Button';
import { twMerge } from 'tailwind-merge';

export function NativeButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  if (!Capacitor.isNativePlatform()) {
    return <Button {...props} />;
  }
  
  return (
    <Button
      {...props}
      className={twMerge(
        // 移动端特定样式
        'safe-area-inset-bottom',
        className
      )}
    />
  );
}
```

#### 1.2.3 Web特定组件开发
```typescript
// src/web/components/WebButton.tsx
import { Capacitor } from '@capacitor/core';
import { Button } from '@/core/components/ui/Button';
import { twMerge } from 'tailwind-merge';

export function WebButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  if (Capacitor.isNativePlatform()) {
    return null;
  }
  
  return (
    <Button
      {...props}
      className={twMerge(
        // Web特定样式
        'hover:shadow-lg transition-shadow',
        className
      )}
    />
  );
}
```

### 1.3 路由开发规范

#### 1.3.1 移动端路由
```typescript
// app/(mobile)/layout.tsx
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

export default function MobileLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {children}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

// app/(mobile)/page.tsx
import { IonContent, IonPage } from '@ionic/react';
import { MobileHeader } from '@/mobile/components/MobileHeader';

export default function MobilePage() {
  return (
    <IonPage>
      <MobileHeader title="首页" />
      <IonContent>
        {/* 页面内容 */}
      </IonContent>
    </IonPage>
  );
}
```

#### 1.3.2 Web路由
```typescript
// app/(web)/layout.tsx
export default function WebLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WebHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <WebFooter />
    </div>
  );
}

// app/(web)/page.tsx
export default function WebPage() {
  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-6">
        {/* 页面内容 */}
      </section>
    </div>
  );
}
```

## 2. 状态管理规范

### 2.1 状态选择指南
| 状态类型 | 推荐方案 | 使用场景 |
|---------|---------|---------|
| 组件内部状态 | useState | 简单的UI状态 |
| 共享状态 | useContext + useReducer | 跨组件共享状态 |
| 复杂状态 | Zustand/Jotai | 全局状态管理 |
| 服务端状态 | React Query/SWR | 数据获取和缓存 |

### 2.2 状态管理示例
```typescript
// src/core/lib/store/feature-store.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FeatureState {
  data: FeatureData[];
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
}

export const useFeatureStore = create<FeatureState>()(
  devtools(
    persist(
      (set) => ({
        data: [],
        loading: false,
        error: null,
        fetchData: async () => {
          set({ loading: true, error: null });
          try {
            const data = await api.getFeatureData();
            set({ data, loading: false });
          } catch (error) {
            set({ error, loading: false });
          }
        },
      }),
      {
        name: 'feature-storage',
      }
    )
  )
);
```

## 3. 样式开发规范

### 3.1 Tailwind 使用规范
```typescript
// src/core/components/ui/Card.tsx
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge(
      // 布局
      'flex flex-col',
      // 间距
      'p-4 space-y-4',
      // 响应式
      'md:p-6 md:space-y-6',
      // 主题
      'bg-white dark:bg-gray-800',
      // 交互
      'hover:shadow-lg transition-shadow',
      // 自定义样式
      className
    )}>
      {children}
    </div>
  );
}
```

### 3.2 移动端样式规范
```typescript
// src/mobile/components/MobileCard.tsx
export function MobileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={twMerge(
      // 移动端特定样式
      'rounded-none',
      'safe-area-inset-bottom',
      className
    )}>
      {children}
    </Card>
  );
}
```

## 4. 性能优化规范

### 4.1 组件优化清单
- [ ] 使用 React.memo 避免不必要的重渲染
- [ ] 使用 useMemo 和 useCallback 缓存值和函数
- [ ] 实现组件懒加载
- [ ] 优化图片加载
- [ ] 实现虚拟列表（如需要）

### 4.2 性能优化示例
```typescript
// 平台特定组件懒加载
const MobileComponent = lazy(() => import('@/mobile/components/MobileComponent'));
const WebComponent = lazy(() => import('@/web/components/WebComponent'));

export function PlatformAwareComponent() {
  const isNative = useMobileStore(state => state.isNative);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isNative ? <MobileComponent /> : <WebComponent />}
    </Suspense>
  );
}
```

## 5. 测试规范

### 5.1 组件测试
```typescript
// src/core/components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});

// src/mobile/components/__tests__/NativeButton.test.tsx
import { Capacitor } from '@capacitor/core';
import { NativeButton } from '../NativeButton';

describe('NativeButton', () => {
  it('renders native button on mobile', () => {
    jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    render(<NativeButton>Click me</NativeButton>);
    expect(screen.getByText('Click me')).toHaveClass('native-button');
  });
});
```

## 6. 文档规范

### 6.1 代码注释规范
```typescript
/**
 * 平台感知的按钮组件
 * @component
 * @example
 * ```tsx
 * <PlatformButton>Click me</PlatformButton>
 * ```
 * @param {string} children - 按钮文本
 * @param {string} variant - 按钮样式变体
 */
```

## 7. 移动端开发规范

### 7.1 Capacitor 插件使用规范
```typescript
// src/mobile/plugins/camera/camera-service.ts
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export class CameraService {
  private static instance: CameraService;
  
  private constructor() {}
  
  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }
  
  async takePhoto() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Camera is only available on native platforms');
    }
    
    return await Camera.getPhoto({
      quality: 90,
      resultType: 'uri'
    });
  }
}
```

### 7.2 移动端性能优化
- 使用虚拟列表处理长列表
- 图片懒加载和预加载
- 合理使用缓存策略
- 优化动画性能

### 7.3 移动端适配规范
- 使用 rem/vw 单位进行响应式布局
- 适配不同屏幕尺寸和像素比
- 处理键盘弹出等特殊场景
- 优化触摸交互体验 