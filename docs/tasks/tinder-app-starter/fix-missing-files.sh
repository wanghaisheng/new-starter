#!/bin/bash

# 缺失文件修复脚本
# 该脚本创建项目中缺失的关键文件

# 输出文件
RESULTS_FILE="docs/tasks/missing-files-fix-results.txt"

# 清空或创建结果文件
echo "缺失文件修复结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 创建目录结构
echo "创建目录结构..." >> $RESULTS_FILE

# 创建app目录
if [ ! -d "app" ]; then
  mkdir -p app
  echo "✅ 已创建app目录" >> $RESULTS_FILE
else
  echo "✓ app目录已存在" >> $RESULTS_FILE
fi

# 创建src目录
if [ ! -d "src" ]; then
  mkdir -p src/core/components
  mkdir -p src/core/models
  mkdir -p src/core/lib/api
  mkdir -p src/core/lib/db
  mkdir -p src/mobile/components
  mkdir -p src/mobile/plugins
  mkdir -p src/web/components
  mkdir -p src/styles
  mkdir -p src/providers/ionic
  echo "✅ 已创建src目录及子目录" >> $RESULTS_FILE
else
  echo "✓ src目录已存在" >> $RESULTS_FILE
  
  # 检查并创建子目录
  if [ ! -d "src/core/components" ]; then
    mkdir -p src/core/components
    echo "✅ 已创建src/core/components目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/core/models" ]; then
    mkdir -p src/core/models
    echo "✅ 已创建src/core/models目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/core/lib/api" ]; then
    mkdir -p src/core/lib/api
    echo "✅ 已创建src/core/lib/api目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/core/lib/db" ]; then
    mkdir -p src/core/lib/db
    echo "✅ 已创建src/core/lib/db目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/mobile/components" ]; then
    mkdir -p src/mobile/components
    echo "✅ 已创建src/mobile/components目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/mobile/plugins" ]; then
    mkdir -p src/mobile/plugins
    echo "✅ 已创建src/mobile/plugins目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/web/components" ]; then
    mkdir -p src/web/components
    echo "✅ 已创建src/web/components目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/styles" ]; then
    mkdir -p src/styles
    echo "✅ 已创建src/styles目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "src/providers/ionic" ]; then
    mkdir -p src/providers/ionic
    echo "✅ 已创建src/providers/ionic目录" >> $RESULTS_FILE
  fi
fi

# 创建docs目录
if [ ! -d "docs" ]; then
  mkdir -p docs/tasks
  mkdir -p docs/templates
  echo "✅ 已创建docs目录及子目录" >> $RESULTS_FILE
else
  echo "✓ docs目录已存在" >> $RESULTS_FILE
  
  # 检查并创建子目录
  if [ ! -d "docs/tasks" ]; then
    mkdir -p docs/tasks
    echo "✅ 已创建docs/tasks目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "docs/templates" ]; then
    mkdir -p docs/templates
    echo "✅ 已创建docs/templates目录" >> $RESULTS_FILE
  fi
fi

# 创建public目录
if [ ! -d "public" ]; then
  mkdir -p public
  echo "✅ 已创建public目录" >> $RESULTS_FILE
else
  echo "✓ public目录已存在" >> $RESULTS_FILE
fi

# 创建capacitor目录
if [ ! -d "capacitor" ]; then
  mkdir -p capacitor
  echo "✅ 已创建capacitor目录" >> $RESULTS_FILE
else
  echo "✓ capacitor目录已存在" >> $RESULTS_FILE
fi

# 创建移动端目录
if [ ! -d "app/(mobile)" ]; then
  mkdir -p app/\(mobile\)/tabs/home
  mkdir -p app/\(mobile\)/tabs/profile
  mkdir -p app/\(mobile\)/tabs/settings
  echo "✅ 已创建移动端目录及子目录" >> $RESULTS_FILE
else
  echo "✓ 移动端目录已存在" >> $RESULTS_FILE
  
  # 检查并创建子目录
  if [ ! -d "app/(mobile)/tabs" ]; then
    mkdir -p app/\(mobile\)/tabs
    echo "✅ 已创建app/(mobile)/tabs目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "app/(mobile)/tabs/home" ]; then
    mkdir -p app/\(mobile\)/tabs/home
    echo "✅ 已创建app/(mobile)/tabs/home目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "app/(mobile)/tabs/profile" ]; then
    mkdir -p app/\(mobile\)/tabs/profile
    echo "✅ 已创建app/(mobile)/tabs/profile目录" >> $RESULTS_FILE
  fi
  
  if [ ! -d "app/(mobile)/tabs/settings" ]; then
    mkdir -p app/\(mobile\)/tabs/settings
    echo "✅ 已创建app/(mobile)/tabs/settings目录" >> $RESULTS_FILE
  fi
fi

# 创建Web端目录
if [ ! -d "app/(web)" ]; then
  mkdir -p app/\(web\)/dashboard
  echo "✅ 已创建Web端目录及子目录" >> $RESULTS_FILE
else
  echo "✓ Web端目录已存在" >> $RESULTS_FILE
  
  # 检查并创建子目录
  if [ ! -d "app/(web)/dashboard" ]; then
    mkdir -p app/\(web\)/dashboard
    echo "✅ 已创建app/(web)/dashboard目录" >> $RESULTS_FILE
  fi
fi

# 创建globals.css文件
echo "创建globals.css文件..." >> $RESULTS_FILE

if [ ! -f "app/globals.css" ]; then
  cat > app/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
EOL
  echo "✅ 已创建globals.css文件" >> $RESULTS_FILE
else
  echo "✓ globals.css文件已存在" >> $RESULTS_FILE
fi

# 创建providers/index.tsx文件
echo "创建providers/index.tsx文件..." >> $RESULTS_FILE

if [ ! -f "src/providers/index.tsx" ]; then
  cat > src/providers/index.tsx << 'EOL'
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
  echo "✅ 已创建providers/index.tsx文件" >> $RESULTS_FILE
else
  echo "✓ providers/index.tsx文件已存在" >> $RESULTS_FILE
fi

# 创建主页文件
echo "创建主页文件..." >> $RESULTS_FILE

if [ ! -f "app/page.tsx" ]; then
  cat > app/page.tsx << 'EOL'
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Link 
          href="/tabs/home" 
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            移动版{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            使用Ionic组件的移动端界面
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Web版{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            使用Tailwind CSS的Web端界面
          </p>
        </Link>
      </div>
    </main>
  );
}
EOL
  echo "✅ 已创建主页文件" >> $RESULTS_FILE
else
  echo "✓ 主页文件已存在" >> $RESULTS_FILE
fi

# 创建Web仪表盘页面
echo "创建Web仪表盘页面..." >> $RESULTS_FILE

if [ ! -f "app/(web)/dashboard/page.tsx" ]; then
  cat > app/\(web\)/dashboard/page.tsx << 'EOL'
export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Web仪表盘</h1>
      <p className="text-xl">这是Web版的仪表盘页面</p>
      
      <div className="mt-8">
        <a 
          href="/"
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
EOL
  echo "✅ 已创建Web仪表盘页面" >> $RESULTS_FILE
else
  echo "✓ Web仪表盘页面已存在" >> $RESULTS_FILE
fi

# 创建移动端页面
echo "创建移动端页面..." >> $RESULTS_FILE

# 创建tabs/page.tsx
if [ ! -f "app/(mobile)/tabs/page.tsx" ]; then
  cat > app/\(mobile\)/tabs/page.tsx << 'EOL'
import { redirect } from 'next/navigation';

export default function TabsPage() {
  redirect('/tabs/home');
}
EOL
  echo "✅ 已创建tabs/page.tsx文件" >> $RESULTS_FILE
else
  echo "✓ tabs/page.tsx文件已存在" >> $RESULTS_FILE
fi

# 创建tabs/home/page.tsx
if [ ! -f "app/(mobile)/tabs/home/page.tsx" ]; then
  cat > app/\(mobile\)/tabs/home/page.tsx << 'EOL'
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
        <h1 className="text-2xl font-bold mb-4">欢迎使用移动端应用</h1>
        <p className="mb-4">这是使用Ionic组件构建的移动端首页。</p>
        <a 
          href="/"
          className="inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          返回主页
        </a>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ 已创建tabs/home/page.tsx文件" >> $RESULTS_FILE
else
  echo "✓ tabs/home/page.tsx文件已存在" >> $RESULTS_FILE
fi

# 创建tabs/profile/page.tsx
if [ ! -f "app/(mobile)/tabs/profile/page.tsx" ]; then
  cat > app/\(mobile\)/tabs/profile/page.tsx << 'EOL'
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
        <p className="mb-4">这是用户个人资料页面。</p>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ 已创建tabs/profile/page.tsx文件" >> $RESULTS_FILE
else
  echo "✓ tabs/profile/page.tsx文件已存在" >> $RESULTS_FILE
fi

# 创建tabs/settings/page.tsx
if [ ! -f "app/(mobile)/tabs/settings/page.tsx" ]; then
  cat > app/\(mobile\)/tabs/settings/page.tsx << 'EOL'
'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

export default function SettingsPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>设置</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="text-2xl font-bold mb-4">设置</h1>
        <p className="mb-4">这是应用设置页面。</p>
      </IonContent>
    </IonPage>
  );
}
EOL
  echo "✅ 已创建tabs/settings/page.tsx文件" >> $RESULTS_FILE
else
  echo "✓ tabs/settings/page.tsx文件已存在" >> $RESULTS_FILE
fi

# 创建tailwind.config.js文件
echo "创建tailwind.config.js文件..." >> $RESULTS_FILE

if [ ! -f "tailwind.config.js" ]; then
  cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
EOL
  echo "✅ 已创建tailwind.config.js文件" >> $RESULTS_FILE
else
  echo "✓ tailwind.config.js文件已存在" >> $RESULTS_FILE
fi

# 创建tsconfig.json文件
echo "创建tsconfig.json文件..." >> $RESULTS_FILE

if [ ! -f "tsconfig.json" ]; then
  cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL
  echo "✅ 已创建tsconfig.json文件" >> $RESULTS_FILE
else
  echo "✓ tsconfig.json文件已存在" >> $RESULTS_FILE
fi

# 创建capacitor.config.ts文件
echo "创建capacitor.config.ts文件..." >> $RESULTS_FILE

if [ ! -f "capacitor.config.ts" ]; then
  cat > capacitor.config.ts << 'EOL'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'capacitor-nextjs-ionic-app',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
EOL
  echo "✅ 已创建capacitor.config.ts文件" >> $RESULTS_FILE
else
  echo "✓ capacitor.config.ts文件已存在" >> $RESULTS_FILE
fi

# 创建.env.local文件
echo "创建.env.local文件..." >> $RESULTS_FILE

if [ ! -f ".env.local" ]; then
  cat > .env.local << 'EOL'
NEXT_PUBLIC_ENV_INITIALIZED=true
EOL
  echo "✅ 已创建.env.local文件" >> $RESULTS_FILE
else
  echo "✓ .env.local文件已存在" >> $RESULTS_FILE
fi

# 创建package.json文件
echo "创建package.json文件..." >> $RESULTS_FILE

if [ ! -f "package.json" ]; then
  cat > package.json << 'EOL'
{
  "name": "capacitor-nextjs-ionic-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:static": "next build && next export",
    "start": "next start",
    "lint": "next lint",
    "cap:add": "cap add",
    "cap:sync": "cap sync",
    "cap:open": "cap open",
    "cap:android": "cap open android",
    "cap:ios": "cap open ios"
  },
  "dependencies": {
    "@capacitor/android": "^5.0.0",
    "@capacitor/cli": "^5.0.0",
    "@capacitor/core": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@ionic/react": "^7.0.0",
    "ionicons": "^7.0.0",
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
EOL
  echo "✅ 已创建package.json文件" >> $RESULTS_FILE
else
  echo "✓ package.json文件已存在" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "缺失文件修复完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bash docs/tasks/fix-hydration-error.sh' 修复水合错误" >> $RESULTS_FILE
echo "2. 运行 'bun install' 或 'npm install' 安装依赖" >> $RESULTS_FILE
echo "3. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "4. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 缺失文件修复完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bash docs/tasks/fix-hydration-error.sh' 修复水合错误"
echo "2. 运行 'bun install' 或 'npm install' 安装依赖"
echo "3. 运行 'bun run dev' 启动开发服务器"
echo "4. 在浏览器中访问 http://localhost:3000" 