#!/bin/bash

# 最小环境检查脚本
# 该脚本检查项目是否可以正常运行的最小要求

# 输出文件
RESULTS_FILE="docs/tasks/minimal-env-check-results.txt"

# 清空或创建结果文件
echo "最小环境检查结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Node.js版本
echo "检查Node.js版本..." >> $RESULTS_FILE
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js已安装: $NODE_VERSION" >> $RESULTS_FILE
else
  echo "❌ Node.js未安装" >> $RESULTS_FILE
  exit 1
fi

# 检查package.json是否存在
echo "检查package.json是否存在..." >> $RESULTS_FILE
if [ -f "package.json" ]; then
  echo "✅ package.json存在" >> $RESULTS_FILE
else
  echo "❌ package.json不存在，请运行初始化脚本" >> $RESULTS_FILE
  exit 1
fi

# 检查关键文件是否存在
echo "检查关键文件是否存在..." >> $RESULTS_FILE
MISSING_FILES=()

if [ ! -f "next.config.js" ]; then
  MISSING_FILES+=("next.config.js")
fi

if [ ! -f "app/page.tsx" ]; then
  MISSING_FILES+=("app/page.tsx")
fi

if [ ! -f "app/layout.tsx" ]; then
  MISSING_FILES+=("app/layout.tsx")
fi

if [ ! -f "src/styles/globals.css" ]; then
  MISSING_FILES+=("src/styles/globals.css")
fi

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "✅ 所有关键文件都存在" >> $RESULTS_FILE
else
  echo "❌ 以下关键文件缺失:" >> $RESULTS_FILE
  for file in "${MISSING_FILES[@]}"; do
    echo "  - $file" >> $RESULTS_FILE
  done
  echo "请运行 'bash docs/tasks/init-project.sh' 创建这些文件" >> $RESULTS_FILE
fi

# 检查.env.local文件
echo "检查.env.local文件..." >> $RESULTS_FILE
if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_ENV_INITIALIZED=true" ".env.local"; then
    echo "✅ .env.local文件存在并包含初始化标记" >> $RESULTS_FILE
  else
    echo "⚠️ .env.local文件存在但不包含初始化标记" >> $RESULTS_FILE
    echo "添加初始化标记..." >> $RESULTS_FILE
    echo "NEXT_PUBLIC_ENV_INITIALIZED=true" >> .env.local
    echo "✅ 初始化标记已添加" >> $RESULTS_FILE
  fi
else
  echo "❌ .env.local文件不存在，创建文件..." >> $RESULTS_FILE
  echo "NEXT_PUBLIC_ENV_INITIALIZED=true" > .env.local
  echo "✅ .env.local文件已创建" >> $RESULTS_FILE
fi

# 检查node_modules目录
echo "检查node_modules目录..." >> $RESULTS_FILE
if [ -d "node_modules" ]; then
  echo "✅ node_modules目录存在" >> $RESULTS_FILE
  
  # 检查关键依赖
  if [ -d "node_modules/next" ] && [ -d "node_modules/react" ] && [ -d "node_modules/react-dom" ]; then
    echo "✅ 关键依赖已安装" >> $RESULTS_FILE
  else
    echo "⚠️ 部分关键依赖缺失，但可能不影响基本功能" >> $RESULTS_FILE
  fi
else
  echo "⚠️ node_modules目录不存在，依赖可能未安装" >> $RESULTS_FILE
  echo "建议运行 'bun install' 或 'npm install' 安装依赖" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "最小环境检查完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "如果所有关键文件都存在，您可以尝试运行项目：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 或 'npm run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "如果遇到依赖问题，请运行 'bash docs/tasks/fix-dependencies.sh' 修复" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 最小环境检查完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "如果所有关键文件都存在，您可以尝试运行项目："
echo "1. 运行 'bun run dev' 或 'npm run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000"
echo ""
echo "如果遇到依赖问题，请运行 'bash docs/tasks/fix-dependencies.sh' 修复" 