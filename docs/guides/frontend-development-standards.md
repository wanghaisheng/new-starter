# 前端开发规范

本文档定义了项目的前端开发规范，包括两套不同的开发标准：

1. **PC端开发标准**: 基于Next.js和第三方UI库
2. **移动端开发标准**: 基于Next.js的路由/数据处理和Ionic UI组件

## 项目核心架构

本项目采用双端架构设计，同时兼顾Web和移动应用的需求：

- **共享核心**: 所有业务逻辑、API调用、状态管理和工具函数
- **分离界面**: PC和移动端使用不同的UI组件库和页面实现
- **统一路由**: 基于Next.js的App Router进行路由管理

```
project/
├── app/                # Next.js App Router
│   ├── (web)/          # PC端路由 (Web)
│   ├── mobile/         # 移动端路由 (App)
│   └── api/            # 共享API路由
├── src/
│   ├── core/           # 共享核心
│   ├── web/            # PC端特定代码
│   ├── mobile/         # 移动端特定代码
│   └── providers/      # 共享Providers
└── docs/
    └── guides/         # 开发文档和规范
```

## 两套前端标准

### PC端开发标准

PC端采用传统的Web开发模式，使用Next.js结合现代第三方UI库进行开发。

**技术栈摘要:**
- **框架**: Next.js
- **UI库**: 第三方组件库（如Material UI, Chakra UI, Ant Design等）
- **样式**: TailwindCSS + CSS Modules
- **状态管理**: React Context + Zustand
- **数据请求**: React Query/SWR

**详细规范请参考:** [PC端前端开发规范](./frontend-development-standards-pc.md)

### 移动端开发标准 

移动端采用混合架构，使用Next.js处理路由和数据逻辑，同时使用Ionic UI组件构建移动应用界面。

**技术栈摘要:**
- **框架**: Next.js (路由、数据渲染和API功能)
- **UI组件库**: Ionic React (移动端UI组件)
- **辅助样式**: TailwindCSS (补充Ionic样式)
- **原生集成**: 可选使用Capacitor进行原生打包

**详细规范请参考:** [移动端前端开发规范](./frontend-development-standards-mobile.md)

## 目录结构划分

### PC端特定目录

```
app/
├── (web)/             # PC端路由
│   ├── page.tsx       # PC首页
│   ├── layout.tsx     # PC布局
│   └── [...其他页面]/  # 其他PC页面
src/
└── web/              # PC端特定代码
    ├── components/   # PC端组件
    ├── hooks/        # PC端hooks
    └── utils/        # PC端工具函数
```

### 移动端特定目录

```
app/
├── mobile/           # 移动端路由
│   ├── page.tsx      # 移动端首页
│   ├── layout.tsx    # 移动端布局(包含IonApp)
│   └── [...其他页面]/ # 其他移动端页面
src/
└── mobile/          # 移动端特定代码
    ├── components/  # 移动端组件
    ├── hooks/       # 移动端hooks
    └── utils/       # 移动端工具函数
```

### 共享目录

```
src/
├── core/            # 共享核心
│   ├── hooks/       # 共享hooks
│   ├── lib/         # 核心库
│   │   ├── db/      # 数据库访问
│   │   ├── api/     # API客户端
│   │   └── i18n/    # 国际化
│   └── models/      # 数据模型
├── providers/       # 全局Providers
└── utils/           # 通用工具函数
```

## 共享代码原则

1. **业务逻辑**: 应放在`core/`目录下，确保PC和移动端共享相同的业务逻辑
2. **API调用**: 所有API调用应在`core/lib/api`中实现，确保数据获取逻辑一致
3. **数据模型**: 所有数据模型和类型定义应在`core/models`中定义
4. **工具函数**: 通用工具函数应放在共享的`utils/`目录中

## 平台特定代码原则

1. **UI组件**: 应根据平台分别实现，PC端使用第三方库，移动端使用Ionic
2. **布局**: 各平台应有独立的布局实现，适应不同设备特性
3. **导航**: PC端使用传统导航，移动端使用底部标签导航
4. **交互**: 移动端应考虑触摸和手势交互，PC端考虑键盘和鼠标交互

## 协作与开发流程

1. **功能开发顺序**: 优先实现核心业务逻辑，然后分别实现PC和移动端UI
2. **API变更**: 需同时更新PC和移动端的相关界面
3. **代码审查**: 需确保核心逻辑的一致性和平台特定代码的合理性
4. **组件开发**: 按照不同平台的组件规范进行开发
5. **测试**: 需在不同平台和设备上进行充分测试

## 兼容性要求

### PC端
- **浏览器**: Chrome, Firefox, Safari, Edge最新两个版本
- **屏幕**: 响应式设计，最小宽度1024px

### 移动端
- **操作系统**: iOS 14+, Android 8.0+
- **屏幕**: 适配常见移动设备屏幕尺寸

## 开发工具推荐

- **IDE**: Visual Studio Code
- **浏览器开发工具**: Chrome DevTools (包含移动设备模拟)
- **移动开发调试**: iOS Simulator, Android Emulator, 实际设备
- **API测试**: Postman/Insomnia
- **UI设计协作**: Figma

## 技术选型的原因

我们选择Next.js+Ionic的混合应用架构，主要基于以下考虑：

1. **开发效率**: 使用React生态系统保持高效开发
2. **UI一致性**: Ionic提供原生风格的UI组件
3. **路由管理**: Next.js提供强大的路由和SSR/SSG能力
4. **代码共享**: 核心逻辑可在PC和移动端共享
5. **部署灵活性**: 可部署为Web应用或打包为原生应用

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