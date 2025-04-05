# 移动端前端开发规范 (Ionic UI + Next.js)

## 1. 技术栈

- **框架**: Next.js (路由、数据渲染和API功能)
- **UI组件库**: Ionic React (移动端UI组件)
- **辅助样式**: TailwindCSS (用于自定义布局和补充Ionic样式)
- **状态管理**: React Context + Zustand
- **数据请求**: React Query/SWR
- **表单管理**: React Hook Form + Zod
- **类型检查**: TypeScript

## 2. 项目目录结构

```
app/                      # Next.js App Router
├── mobile/               # 移动端路由
│   ├── page.tsx          # 移动端首页
│   ├── layout.tsx        # 移动端布局 (包含IonApp初始化)
│   ├── home/             # 首页功能
│   ├── discover/         # 发现页功能
│   ├── profile/          # 个人页功能
│   └── [...其他功能]/     # 其他移动端功能页面
└── api/                  # API路由 (共享)

src/
├── assets/               # 静态资源
│   ├── locales/          # 国际化资源文件
│   └── images/           # 图片资源
├── core/                 # 共享核心
│   ├── hooks/            # 共享Hooks
│   ├── lib/              # 核心库
│   │   ├── db/           # 数据库访问层
│   │   ├── i18n/         # 国际化核心
│   │   └── api/          # API客户端
│   └── models/           # 数据模型
├── mobile/               # 移动端特定代码
│   ├── components/       # 移动端组件
│   │   ├── layout/       # 布局组件
│   │   ├── navigation/   # 导航组件
│   │   ├── ui/           # UI组件
│   │   └── features/     # 功能组件
│   └── utils/            # 移动端特定工具
├── providers/            # 全局Providers
├── styles/               # 全局样式
└── utils/                # 通用工具
```

## 3. Ionic与Next.js集成规范

### 3.1 基础配置

1. **初始化Ionic React**
```tsx
// app/mobile/layout.tsx
'use client';

// Ionic组件和初始化
import { setupIonicReact, IonApp, IonContent } from '@ionic/react';

// Ionic核心CSS 
import '@ionic/react/css/core.css';

// 基础CSS
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

// 可选组件CSS
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// 全局CSS
import '@/styles/globals.css';
import '@/styles/variables.css';

// 配置Ionic React
setupIonicReact({
  mode: 'ios', // 使用iOS设计风格统一
});

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IonApp>
      <IonContent>
        {children}
      </IonContent>
    </IonApp>
  );
}
```

2. **Tailwind配置调整**
   
```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    preflight: false, // 禁用preflight避免与Ionic样式冲突
  },
  theme: {
    extend: {
      colors: {
        // 在此处扩展颜色以匹配Ionic变量
        primary: 'var(--ion-color-primary)',
        secondary: 'var(--ion-color-secondary)',
        // ...其他颜色
      },
    },
  },
  plugins: [],
};
```

3. **Ionic CSS变量**

```css
/* app/styles/variables.css */
:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;

  /* 其他Ionic颜色变量... */
}
```

## 4. 组件开发规范

### 4.1 Ionic组件使用规范

1. **导入Ionic组件**
```tsx
// 正确导入方式
import { IonButton, IonCard, IonContent } from '@ionic/react';

// 避免使用以下方式
import IonButton from '@ionic/react/IonButton'; // ❌ 错误
```

2. **组件命名**
```tsx
// src/mobile/components/ui/CustomButton.tsx
import { IonButton } from '@ionic/react';
import { twMerge } from 'tailwind-merge';

interface CustomButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'text';
  color?: string;
  className?: string;
  [x: string]: any;
}

export function CustomButton({
  children,
  variant = 'default',
  color = 'primary',
  className,
  ...props
}: CustomButtonProps) {
  return (
    <IonButton
      fill={variant === 'outline' ? 'outline' : variant === 'text' ? 'clear' : 'solid'}
      color={color}
      className={twMerge('rounded-lg', className)}
      {...props}
    >
      {children}
    </IonButton>
  );
}
```

3. **使用Tailwind补充Ionic样式**
```tsx
<IonCard className="mx-4 my-2 rounded-xl shadow-lg">
  <IonCardHeader>
    <IonCardTitle className="text-lg font-bold text-primary">卡片标题</IonCardTitle>
  </IonCardHeader>
  <IonCardContent className="p-4">
    <p className="text-gray-600">卡片内容</p>
  </IonCardContent>
</IonCard>
```

### 4.2 页面结构规范

```tsx
// app/mobile/discover/page.tsx
'use client';

import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { BottomNavBar } from '@/mobile/components/navigation/BottomNavBar';
import { DiscoverContent } from '@/mobile/components/features/discover/DiscoverContent';

export default function DiscoverPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>发现</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="pb-20"> {/* 底部添加padding，避免内容被导航栏遮挡 */}
          <DiscoverContent />
        </div>
      </IonContent>
      <BottomNavBar />
    </IonPage>
  );
}
```

### 4.3 导航组件规范

```tsx
// src/mobile/components/navigation/BottomNavBar.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { IonIcon, IonTabBar, IonTabButton, IonLabel } from '@ionic/react';
import { homeOutline, searchOutline, heartOutline, chatbubbleOutline, personOutline } from 'ionicons/icons';

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isActive = (path: string) => pathname?.startsWith(path);
  
  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-10">
      <IonTabBar slot="bottom" className="w-full">
        <IonTabButton 
          tab="home" 
          selected={isActive('/mobile/home')} 
          onClick={navigateTo('/mobile/home')}
          className="flex-1"
        >
          <IonIcon icon={homeOutline} />
          <IonLabel>首页</IonLabel>
        </IonTabButton>
        
        <IonTabButton 
          tab="discover" 
          selected={isActive('/mobile/discover')} 
          onClick={navigateTo('/mobile/discover')}
          className="flex-1"
        >
          <IonIcon icon={searchOutline} />
          <IonLabel>发现</IonLabel>
        </IonTabButton>
        
        <IonTabButton 
          tab="matches" 
          selected={isActive('/mobile/matches')} 
          onClick={navigateTo('/mobile/matches')}
          className="flex-1"
        >
          <IonIcon icon={heartOutline} />
          <IonLabel>匹配</IonLabel>
        </IonTabButton>
        
        <IonTabButton 
          tab="messages" 
          selected={isActive('/mobile/messages')} 
          onClick={navigateTo('/mobile/messages')}
          className="flex-1"
        >
          <IonIcon icon={chatbubbleOutline} />
          <IonLabel>消息</IonLabel>
        </IonTabButton>
        
        <IonTabButton 
          tab="profile" 
          selected={isActive('/mobile/profile')} 
          onClick={navigateTo('/mobile/profile')}
          className="flex-1"
        >
          <IonIcon icon={personOutline} />
          <IonLabel>我的</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </div>
  );
}
```

## 5. Next.js与Ionic路由集成

### 5.1 使用Next.js管理路由

```tsx
// src/mobile/components/features/profile/UserProfile.tsx
'use client';

import { useRouter } from 'next/navigation';
import { IonButton, IonCard, IonCardContent } from '@ionic/react';

export function UserProfile({ userId }: { userId: string }) {
  const router = useRouter();
  
  const navigateToSettings = () => {
    router.push(`/mobile/profile/settings`);
  };
  
  return (
    <IonCard>
      <IonCardContent>
        <h2>用户资料: {userId}</h2>
        <IonButton onClick={navigateToSettings}>
          设置
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
```

### 5.2 页面过渡和动画

```tsx
// src/mobile/components/navigation/PageTransition.tsx
'use client';

import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, x: 100 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ type: 'linear', duration: 0.3 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// 使用示例
// app/mobile/profile/page.tsx
import { PageTransition } from '@/mobile/components/navigation/PageTransition';

export default function ProfilePage() {
  return (
    <IonPage>
      <IonHeader>...</IonHeader>
      <IonContent>
        <PageTransition>
          <div>Profile Content</div>
        </PageTransition>
      </IonContent>
      <BottomNavBar />
    </IonPage>
  );
}
```

## 6. Ionic组件与状态管理

### 6.1 Zustand与Ionic组件集成

```tsx
// src/mobile/stores/auth-store.ts
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

// src/mobile/components/features/auth/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText
} from '@ionic/react';
import { useAuthStore } from '@/mobile/stores/auth-store';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    if (!error) {
      router.push('/mobile/home');
    }
  };
  
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>登录</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <form onSubmit={handleSubmit}>
          <IonList>
            <IonItem>
              <IonInput
                label="邮箱"
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="密码"
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                required
              />
            </IonItem>
          </IonList>
          
          {error && (
            <IonText color="danger" className="px-4 py-2 block">
              {error.message}
            </IonText>
          )}
          
          <div className="px-4 py-4">
            <IonButton expand="block" type="submit" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </IonButton>
          </div>
        </form>
      </IonCardContent>
    </IonCard>
  );
}
```

## 7. 数据获取与Ionic界面集成

### 7.1 使用React Query与Ionic加载状态

```tsx
// src/mobile/hooks/useUserProfile.ts
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/core/lib/api/users';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId)
  });
}

// src/mobile/components/features/profile/ProfileView.tsx
import { IonSpinner, IonCard, IonCardContent, IonText, IonAvatar, IonItem, IonLabel } from '@ionic/react';
import { useUserProfile } from '@/mobile/hooks/useUserProfile';

export function ProfileView({ userId }: { userId: string }) {
  const { data: profile, isLoading, error } = useUserProfile(userId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <IonSpinner name="circles" />
      </div>
    );
  }
  
  if (error) {
    return (
      <IonCard>
        <IonCardContent>
          <IonText color="danger">加载失败: {error.message}</IonText>
        </IonCardContent>
      </IonCard>
    );
  }
  
  return (
    <IonCard>
      <IonCardContent>
        <IonItem lines="none">
          <IonAvatar slot="start">
            <img src={profile.avatar} alt={profile.name} />
          </IonAvatar>
          <IonLabel>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-gray-500">{profile.bio}</p>
          </IonLabel>
        </IonItem>
        
        {/* 其他个人资料信息 */}
      </IonCardContent>
    </IonCard>
  );
}
```

## 8. Ionic表单和验证

### 8.1 结合React Hook Form与Ionic表单

```tsx
// src/mobile/components/forms/ProfileEditForm.tsx
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 定义表单验证规则
const profileSchema = z.object({
  name: z.string().min(2, '名称至少2个字符'),
  bio: z.string().max(150, '简介不能超过150个字符'),
  age: z.number().min(18, '年龄必须大于18').max(120, '年龄必须小于120'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileEditForm({ initialData, onSubmit }: {
  initialData: ProfileFormValues;
  onSubmit: (data: ProfileFormValues) => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });
  
  const submitHandler = handleSubmit(onSubmit);
  
  return (
    <form onSubmit={submitHandler}>
      <IonList>
        <IonItem>
          <IonLabel position="stacked">名称</IonLabel>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <IonInput
                value={field.value}
                onIonChange={(e) => field.onChange(e.detail.value!)}
                className={errors.name ? 'ion-invalid' : ''}
              />
            )}
          />
          {errors.name && (
            <IonText color="danger" className="text-xs pl-2">
              {errors.name.message}
            </IonText>
          )}
        </IonItem>
        
        <IonItem>
          <IonLabel position="stacked">简介</IonLabel>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <IonInput
                value={field.value}
                onIonChange={(e) => field.onChange(e.detail.value!)}
                className={errors.bio ? 'ion-invalid' : ''}
              />
            )}
          />
          {errors.bio && (
            <IonText color="danger" className="text-xs pl-2">
              {errors.bio.message}
            </IonText>
          )}
        </IonItem>
        
        <IonItem>
          <IonLabel position="stacked">年龄</IonLabel>
          <Controller
            name="age"
            control={control}
            render={({ field }) => (
              <IonInput
                type="number"
                value={field.value}
                onIonChange={(e) => field.onChange(parseInt(e.detail.value!, 10))}
                className={errors.age ? 'ion-invalid' : ''}
              />
            )}
          />
          {errors.age && (
            <IonText color="danger" className="text-xs pl-2">
              {errors.age.message}
            </IonText>
          )}
        </IonItem>
      </IonList>
      
      <div className="px-4 py-4">
        <IonButton expand="block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存'}
        </IonButton>
      </div>
    </form>
  );
}
```

## 9. 自定义Ionic主题和样式

### 9.1 定制Ionic主题

```css
/* src/styles/ionic-theme.css */
:root {
  /* 主题颜色 */
  --ion-color-primary: #FF6B00;
  --ion-color-primary-rgb: 255, 107, 0;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #e05e00;
  --ion-color-primary-tint: #ff7a1a;
  
  /* 次要颜色 */
  --ion-color-secondary: #3DC2FF;
  --ion-color-secondary-rgb: 61, 194, 255;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #36abe0;
  --ion-color-secondary-tint: #50c8ff;
  
  /* 自定义字体 */
  --ion-font-family: 'PingFang SC', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  
  /* 全局圆角 */
  --ion-border-radius: 8px;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --ion-background-color: #121212;
    --ion-background-color-rgb: 18, 18, 18;
    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255, 255, 255;
    --ion-border-color: #222222;
  }
}
```

### 9.2 全局组件样式覆盖

```css
/* app/globals.css */
/* 导入Ionic主题 */
@import '../src/styles/ionic-theme.css';

/* Tailwind指令 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Ionic组件样式覆盖 */
@layer components {
  /* 自定义按钮样式 */
  ion-button {
    --border-radius: 10px !important;
    --box-shadow: none !important;
    font-weight: 600 !important;
  }
  
  /* 自定义卡片样式 */
  ion-card {
    border-radius: 16px !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05) !important;
  }
  
  /* 底部标签栏样式 */
  ion-tab-bar {
    --background: #ffffff !important;
    --border: none !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
    padding-bottom: env(safe-area-inset-bottom) !important;
  }
  
  /* 选中的标签按钮 */
  ion-tab-button.tab-selected {
    --color-selected: var(--ion-color-primary) !important;
  }
}
```

## 10. 移动端特定优化

### 10.1 手势和触摸优化

```tsx
// src/mobile/components/ui/SwipeableCard.tsx
'use client';

import { useRef } from 'react';
import { IonCard, IonCardContent } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

// 导入Swiper样式
import 'swiper/css';
import 'swiper/css/pagination';

interface SwipeableCardProps {
  images: string[];
  onLike: () => void;
  onDislike: () => void;
}

export function SwipeableCard({ images, onLike, onDislike }: SwipeableCardProps) {
  const cardRef = useRef<HTMLIonCardElement>(null);
  let startX = 0;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // 应用旋转和移动效果
    cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.05}deg)`;
    
    // 根据滑动方向改变背景色
    if (deltaX > 50) {
      cardRef.current.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    } else if (deltaX < -50) {
      cardRef.current.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    } else {
      cardRef.current.style.backgroundColor = '';
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - startX;
    
    // 重置样式
    cardRef.current.style.transform = '';
    cardRef.current.style.backgroundColor = '';
    
    // 判断滑动方向和距离
    if (deltaX > 100) {
      onLike();
    } else if (deltaX < -100) {
      onDislike();
    }
  };
  
  return (
    <IonCard 
      ref={cardRef}
      className="w-full max-w-sm mx-auto overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        className="h-80"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img 
              src={image} 
              alt={`Slide ${index}`} 
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      
      <IonCardContent>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">用户卡片</h3>
          <div className="flex space-x-2">
            <button 
              className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
              onClick={onDislike}
            >
              ✕
            </button>
            <button 
              className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"
              onClick={onLike}
            >
              ✓
            </button>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
}
```

### 10.2 设备API整合

```tsx
// src/mobile/hooks/useDeviceCamera.ts
'use client';

import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export function useDeviceCamera() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const takePhoto = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      setPhoto(image.webPath || null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectPhotoFromGallery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      
      setPhoto(image.webPath || null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    photo,
    error,
    isLoading,
    takePhoto,
    selectPhotoFromGallery
  };
}

// 使用示例
// src/mobile/components/features/profile/ProfilePicture.tsx
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { camera, images } from 'ionicons/icons';
import { useDeviceCamera } from '@/mobile/hooks/useDeviceCamera';

export function ProfilePicture() {
  const { photo, isLoading, takePhoto, selectPhotoFromGallery } = useDeviceCamera();
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <IonSpinner />
          </div>
        ) : (
          photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Photo
            </div>
          )
        )}
      </div>
      
      <div className="flex space-x-2">
        <IonButton onClick={takePhoto} size="small">
          <IonIcon slot="start" icon={camera} />
          拍照
        </IonButton>
        <IonButton onClick={selectPhotoFromGallery} size="small">
          <IonIcon slot="start" icon={images} />
          从相册选择
        </IonButton>
      </div>
    </div>
  );
}
```

## 11. 性能优化指南

1. **Ionic组件优化**
   - 使用`IonVirtualScroll`处理长列表
   - 为列表项实现`React.memo`避免不必要渲染
   - 延迟加载不在视口内的图片和组件

2. **减少重新渲染**
   - 使用`useCallback`缓存事件处理函数
   - 使用`useMemo`缓存计算属性
   - 基于路由预加载资源

3. **Ionic动画优化**
   - 使用`will-change`提示浏览器
   - 动画使用`transform`和`opacity`属性
   - 使用硬件加速: `transform: translateZ(0)`

## 12. 打包和部署

1. **Web部署**
   - 使用Next.js的默认构建和部署
   - 确保针对移动端的响应式设计

2. **原生部署准备**
   - 添加Capacitor以包装为原生应用
   - 配置原生平台特定设置

```bash
# 安装Capacitor
npm install @capacitor/core @capacitor/cli

# 初始化Capacitor
npx cap init [appName] [appId]

# 添加平台
npx cap add android
npx cap add ios

# 构建Web应用
npm run build

# 复制Web应用到原生项目
npx cap copy

# 打开原生IDE
npx cap open android
npx cap open ios
```

## 13. 混合应用开发最佳实践

1. **代码共享策略**
   - 将业务逻辑和API调用集中在共享核心
   - UI组件尽量使用平台特定实现
   - 通用hooks和utils放在共享文件夹

2. **条件渲染**
   - 使用环境变量或平台检测条件渲染
   - 设备类型检测实现适配不同屏幕尺寸

3. **集成原生功能**
   - 使用Capacitor插件访问原生功能
   - 为Web端提供优雅的降级方案

4. **测试策略**
   - 在实际设备上测试触摸和手势
   - 使用Chrome DevTools的设备模拟
   - 测试不同网络条件下的应用表现 