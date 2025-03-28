#!/bin/bash

# 水合错误修复脚本
# 该脚本修复Next.js与Ionic组件之间的水合错误

# 输出文件
RESULTS_FILE="docs/tasks/hydration-fix-results.txt"

# 清空或创建结果文件
echo "水合错误修复结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 更新根布局文件
echo "更新根布局文件..." >> $RESULTS_FILE

# 检查app/layout.tsx是否存在
if [ -f "app/layout.tsx" ]; then
  # 备份原文件
  cp app/layout.tsx app/layout.tsx.bak
  echo "✅ 已备份原始layout文件" >> $RESULTS_FILE
  
  # 更新文件内容
  cat > app/layout.tsx << 'EOL'
import './globals.css';
import { Providers } from '@/src/providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目',
  description: '一个集成了Next.js 15、Ionic、Tailwind CSS和Capacitor的全栈移动应用启动项目',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOL
  echo "✅ 已更新根布局文件，添加了suppressHydrationWarning属性" >> $RESULTS_FILE
else
  echo "❌ 根布局文件不存在，无法更新" >> $RESULTS_FILE
fi

# 更新Ionic Provider
echo "更新Ionic Provider..." >> $RESULTS_FILE

# 检查src/providers/ionic/index.tsx是否存在
if [ -f "src/providers/ionic/index.tsx" ]; then
  # 备份原文件
  cp src/providers/ionic/index.tsx src/providers/ionic/index.tsx.bak
  echo "✅ 已备份原始Ionic Provider文件" >> $RESULTS_FILE
  
  # 更新文件内容
  cat > src/providers/ionic/index.tsx << 'EOL'
'use client';

import { IonApp } from '@ionic/react';
import { PropsWithChildren, useEffect } from 'react';

// 导入Ionic样式
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

export function IonicProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // 在客户端初始化Ionic
    document.documentElement.classList.add('ion-ce');
  }, []);

  return (
    <IonApp>
      {children}
    </IonApp>
  );
}
EOL
  echo "✅ 已更新Ionic Provider文件" >> $RESULTS_FILE
else
  echo "❌ Ionic Provider文件不存在，无法更新" >> $RESULTS_FILE
fi

# 更新移动端标签页布局
echo "更新移动端标签页布局..." >> $RESULTS_FILE

# 检查app/(mobile)/tabs/layout.tsx是否存在
if [ -f "app/(mobile)/tabs/layout.tsx" ]; then
  # 备份原文件
  cp "app/(mobile)/tabs/layout.tsx" "app/(mobile)/tabs/layout.tsx.bak"
  echo "✅ 已备份原始移动端标签页布局文件" >> $RESULTS_FILE
  
  # 更新文件内容
  cat > "app/(mobile)/tabs/layout.tsx" << 'EOL'
'use client';

import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { home, person, settings } from 'ionicons/icons';
import { PropsWithChildren, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TabsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 在客户端渲染之前不显示Tabs
  if (!mounted) {
    return <>{children}</>;
  }
  
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
  echo "✅ 已更新移动端标签页布局文件，添加了客户端渲染控制" >> $RESULTS_FILE
else
  echo "❌ 移动端标签页布局文件不存在，无法更新" >> $RESULTS_FILE
fi

# 创建next.config.js文件
echo "更新Next.js配置..." >> $RESULTS_FILE

# 检查next.config.js是否存在
if [ -f "next.config.js" ]; then
  # 备份原文件
  cp next.config.js next.config.js.bak
  echo "✅ 已备份原始Next.js配置文件" >> $RESULTS_FILE
  
  # 更新文件内容
  cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 禁用服务器组件以避免与Ionic的兼容性问题
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 配置Ionic和Capacitor相关的webpack设置
  webpack: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
        },
      },
    };
  },
};

module.exports = nextConfig;
EOL
  echo "✅ 已更新Next.js配置文件" >> $RESULTS_FILE
else
  echo "❌ Next.js配置文件不存在，创建新文件..." >> $RESULTS_FILE
  
  # 创建新文件
  cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 禁用服务器组件以避免与Ionic的兼容性问题
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 配置Ionic和Capacitor相关的webpack设置
  webpack: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
        },
      },
    };
  },
};

module.exports = nextConfig;
EOL
  echo "✅ 已创建Next.js配置文件" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "水合错误修复完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE
echo "3. 检查是否还有水合错误" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 水合错误修复完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bun run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000"
echo "3. 检查是否还有水合错误" 