#!/bin/bash

# 移动端页面创建脚本
# 该脚本创建移动端的基本页面结构

# 输出文件
RESULTS_FILE="docs/tasks/mobile-pages-results.txt"

# 清空或创建结果文件
echo "移动端页面创建结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 创建移动端Tabs布局
echo "创建移动端Tabs布局..." >> $RESULTS_FILE

# 创建tabs布局
mkdir -p app/\(mobile\)/tabs

# 创建tabs/layout.tsx
if [ ! -f "app/(mobile)/tabs/layout.tsx" ]; then
  cat > "app/(mobile)/tabs/layout.tsx" << 'EOL'
'use client';

import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { home, person, settings } from 'ionicons/icons';
import { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';

export default function TabsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  
  return (
    <IonTabs>
      <IonRouterOutlet>
        {children}
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home" selected={pathname === '/tabs/home'}>
          <IonIcon icon={home} />
          <IonLabel>首页</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile" selected={pathname === '/tabs/profile'}>
          <IonIcon icon={person} />
          <IonLabel>我的</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings" selected={pathname === '/tabs/settings'}>
          <IonIcon icon={settings} />
          <IonLabel>设置</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
EOL
  echo "✅ app/(mobile)/tabs/layout.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(mobile)/tabs/layout.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建tabs/page.tsx
if [ ! -f "app/(mobile)/tabs/page.tsx" ]; then
  cat > "app/(mobile)/tabs/page.tsx" << 'EOL'
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TabsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 默认重定向到首页标签
    router.replace('/tabs/home');
  }, [router]);
  
  return null;
}
EOL
  echo "✅ app/(mobile)/tabs/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(mobile)/tabs/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建各个标签页
echo "创建标签页..." >> $RESULTS_FILE

# 创建home标签页
mkdir -p app/\(mobile\)/tabs/home
if [ ! -f "app/(mobile)/tabs/home/page.tsx" ]; then
  cat > "app/(mobile)/tabs/home/page.tsx" << 'EOL'
'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>首页</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="text-2xl font-bold mb-4">欢迎使用</h1>
        <p>这是移动应用的首页标签。</p>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ app/(mobile)/tabs/home/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(mobile)/tabs/home/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建profile标签页
mkdir -p app/\(mobile\)/tabs/profile
if [ ! -f "app/(mobile)/tabs/profile/page.tsx" ]; then
  cat > "app/(mobile)/tabs/profile/page.tsx" << 'EOL'
'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

export default function ProfilePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>我的</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="text-2xl font-bold mb-4">个人资料</h1>
        <p>这是用户个人资料页面。</p>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ app/(mobile)/tabs/profile/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(mobile)/tabs/profile/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建settings标签页
mkdir -p app/\(mobile\)/tabs/settings
if [ ! -f "app/(mobile)/tabs/settings/page.tsx" ]; then
  cat > "app/(mobile)/tabs/settings/page.tsx" << 'EOL'
'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonToggle } from '@ionic/react';

export default function SettingsPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>设置</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel>深色模式</IonLabel>
            <IonToggle slot="end" />
          </IonItem>
          <IonItem>
            <IonLabel>通知</IonLabel>
            <IonToggle slot="end" defaultChecked />
          </IonItem>
          <IonItem>
            <IonLabel>自动更新</IonLabel>
            <IonToggle slot="end" defaultChecked />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ app/(mobile)/tabs/settings/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(mobile)/tabs/settings/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建Web版页面
echo "创建Web版页面..." >> $RESULTS_FILE

# 创建dashboard页面
mkdir -p app/\(web\)/dashboard
if [ ! -f "app/(web)/dashboard/page.tsx" ]; then
  cat > "app/(web)/dashboard/page.tsx" << 'EOL'
export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Web版仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">数据概览</h2>
          <p>这里显示重要的数据指标。</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">最近活动</h2>
          <p>这里显示最近的用户活动。</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">系统状态</h2>
          <p>这里显示系统运行状态。</p>
        </div>
      </div>
    </main>
  );
}
EOL
  echo "✅ app/(web)/dashboard/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/(web)/dashboard/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建Ionic Provider
echo "创建Ionic Provider..." >> $RESULTS_FILE
mkdir -p src/providers/ionic
if [ ! -f "src/providers/ionic/index.tsx" ]; then
  cat > "src/providers/ionic/index.tsx" << 'EOL'
'use client';

import { PropsWithChildren, useEffect } from 'react';
import { setupIonicReact, IonApp } from '@ionic/react';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// 配置Ionic
setupIonicReact({
  mode: 'ios',
});

export function IonicProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // 在客户端初始化Ionic
    document.documentElement.classList.add('ion-ce');
  }, []);

  return <IonApp>{children}</IonApp>;
}
EOL
  echo "✅ src/providers/ionic/index.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ src/providers/ionic/index.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 更新主Providers
if [ -f "src/providers/index.tsx" ]; then
  cat > "src/providers/index.tsx" << 'EOL'
'use client';

import { PropsWithChildren } from 'react';
import { IonicProvider } from './ionic';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      {children}
    </IonicProvider>
  );
}
EOL
  echo "✅ src/providers/index.tsx 更新成功" >> $RESULTS_FILE
else
  echo "❌ src/providers/index.tsx 不存在，无法更新" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "移动端页面创建完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE
echo "3. 点击'移动版'链接测试移动端页面" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 移动端页面创建完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bun run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000"
echo "3. 点击'移动版'链接测试移动端页面" 