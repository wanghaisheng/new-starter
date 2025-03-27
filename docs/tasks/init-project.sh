#!/bin/bash

# 项目初始化脚本
# 该脚本创建基础项目结构和配置文件

# 输出文件
RESULTS_FILE="docs/tasks/project-init-results.txt"

# 清空或创建结果文件
echo "项目初始化结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Node.js和bun版本
echo "检查Node.js和bun版本..." >> $RESULTS_FILE
NODE_VERSION=$(node -v)
echo "Node.js版本: $NODE_VERSION" >> $RESULTS_FILE
BUN_VERSION=$(bun -v)
echo "bun版本: $BUN_VERSION" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 创建项目目录结构
echo "创建项目目录结构..." >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 创建app目录结构
mkdir -p app/api
mkdir -p app/\(mobile\)
mkdir -p app/\(web\)

# 创建src目录结构
mkdir -p src/assets/locales
mkdir -p src/assets/images
mkdir -p src/core/components
mkdir -p src/core/hooks
mkdir -p src/core/lib/db
mkdir -p src/core/lib/i18n
mkdir -p src/core/lib/api
mkdir -p src/core/models
mkdir -p src/mobile/components
mkdir -p src/mobile/plugins
mkdir -p src/mobile/utils
mkdir -p src/web
mkdir -p src/providers
mkdir -p src/styles
mkdir -p src/utils

# 创建docs目录结构
mkdir -p docs/tasks
mkdir -p docs/templates

# 创建其他必要目录
mkdir -p public
mkdir -p capacitor

# 创建基础配置文件
echo "创建基础配置文件..." >> $RESULTS_FILE

# 创建package.json
if [ ! -f "package.json" ]; then
  cat > package.json << 'EOL'
{
  "name": "capacitor-nextjs-ionic-tailwind",
  "version": "1.0.0",
  "description": "Next.js 15 + Ionic + Tailwind + Capacitor 全栈启动项目",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:static": "next build",
    "start": "next start",
    "lint": "next lint",
    "cap:sync": "npx cap sync",
    "cap:android": "npx cap open android",
    "cap:ios": "npx cap open ios",
    "deploy:test": "echo '部署到测试环境'",
    "deploy:prod": "echo '部署到生产环境'",
    "test": "echo '运行测试'"
  },
  "dependencies": {
    "@capacitor/android": "^5.7.0",
    "@capacitor/core": "^5.7.0",
    "@capacitor/ios": "^5.7.0",
    "@ionic/react": "^7.8.0",
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^5.7.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
EOL
  echo "✅ package.json 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ package.json 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建next.config.js
if [ ! -f "next.config.js" ]; then
  cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
EOL
  echo "✅ next.config.js 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ next.config.js 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建capacitor.config.ts
if [ ! -f "capacitor.config.ts" ]; then
  cat > capacitor.config.ts << 'EOL'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Capacitor Next.js App',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
EOL
  echo "✅ capacitor.config.ts 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ capacitor.config.ts 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建tailwind.config.js
if [ ! -f "tailwind.config.js" ]; then
  cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOL
  echo "✅ tailwind.config.js 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ tailwind.config.js 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建postcss.config.js
if [ ! -f "postcss.config.js" ]; then
  cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOL
  echo "✅ postcss.config.js 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ postcss.config.js 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建tsconfig.json
if [ ! -f "tsconfig.json" ]; then
  cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
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
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL
  echo "✅ tsconfig.json 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ tsconfig.json 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建.gitignore
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'EOL'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# capacitor
/android
/ios

# python
/venv
__pycache__/
*.py[cod]
*$py.class
EOL
  echo "✅ .gitignore 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ .gitignore 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建基础页面
echo "创建基础页面..." >> $RESULTS_FILE

# 创建app/layout.tsx
mkdir -p app
if [ ! -f "app/layout.tsx" ]; then
  cat > app/layout.tsx << 'EOL'
import '@/styles/globals.css';
import { Providers } from '@/providers';

export const metadata = {
  title: 'Capacitor Next.js App',
  description: 'Next.js 15 + Ionic + Tailwind + Capacitor 全栈启动项目',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOL
  echo "✅ app/layout.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/layout.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建app/page.tsx
if [ ! -f "app/page.tsx" ]; then
  cat > app/page.tsx << 'EOL'
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">
        Capacitor + Next.js 15 + Ionic + Tailwind
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        <Link href="/(web)/dashboard" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-semibold mb-2">Web版 &rarr;</h2>
          <p>访问Web专属页面</p>
        </Link>
        <Link href="/(mobile)/tabs" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-semibold mb-2">移动版 &rarr;</h2>
          <p>访问移动端专属页面</p>
        </Link>
      </div>
    </main>
  );
}
EOL
  echo "✅ app/page.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ app/page.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建全局样式
if [ ! -f "src/styles/globals.css" ]; then
  cat > src/styles/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
EOL
  echo "✅ src/styles/globals.css 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ src/styles/globals.css 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建providers
if [ ! -f "src/providers/index.tsx" ]; then
  cat > src/providers/index.tsx << 'EOL'
'use client';

import { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
  return (
    <>
      {children}
    </>
  );
}
EOL
  echo "✅ src/providers/index.tsx 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ src/providers/index.tsx 已存在，跳过创建" >> $RESULTS_FILE
fi

# 创建.env.local文件（如果不存在）
if [ ! -f ".env.local" ]; then
  cat > .env.local << 'EOL'
NEXT_PUBLIC_ENV_INITIALIZED=true
EOL
  echo "✅ .env.local 创建成功" >> $RESULTS_FILE
else
  echo "⚠️ .env.local 已存在，跳过创建" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "项目初始化完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bash docs/tasks/init-git-repo.sh' 初始化Git仓库" >> $RESULTS_FILE
echo "2. 运行 'bash docs/tasks/install-dependencies.sh' 安装依赖" >> $RESULTS_FILE
echo "3. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 项目初始化完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bash docs/tasks/init-git-repo.sh' 初始化Git仓库"
echo "2. 运行 'bash docs/tasks/install-dependencies.sh' 安装依赖"
echo "3. 运行 'bun run dev' 启动开发服务器"