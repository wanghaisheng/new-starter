#!/bin/bash

# 环境检查脚本
# 该脚本检查项目环境是否已正确初始化

# 输出文件
RESULTS_FILE="docs/tasks/environment-check-results.txt"

# 检查是否需要强制重新检查
FORCE_CHECK=false
if [ "$1" == "--force" ]; then
  FORCE_CHECK=true
fi

# 检查.env.local文件是否存在并包含初始化标记
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_ENV_INITIALIZED=true" ".env.local" ] && [ "$FORCE_CHECK" == "false" ]; then
  echo "✅ 项目环境已初始化。如需重新检查，请使用 --force 参数。"
  exit 0
fi

# 清空或创建结果文件
echo "环境检查结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Node.js版本
echo "检查Node.js版本..." >> $RESULTS_FILE
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js已安装: $NODE_VERSION" >> $RESULTS_FILE
  
  # 检查Node.js版本是否满足要求
  NODE_VERSION_NUM=$(echo $NODE_VERSION | cut -c 2- | cut -d. -f1)
  if [ $NODE_VERSION_NUM -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18.17.0或更高版本" >> $RESULTS_FILE
    echo "❌ Node.js版本过低，需要18.17.0或更高版本"
    exit 1
  fi
else
  echo "❌ Node.js未安装" >> $RESULTS_FILE
  echo "❌ Node.js未安装，请安装Node.js 18.17.0或更高版本"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查bun版本
echo "检查bun版本..." >> $RESULTS_FILE
if command -v bun &> /dev/null; then
  BUN_VERSION=$(bun -v)
  echo "✅ bun已安装: $BUN_VERSION" >> $RESULTS_FILE
else
  echo "❌ bun未安装" >> $RESULTS_FILE
  echo "❌ bun未安装，请安装bun"
  echo "安装命令: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查Git版本
echo "检查Git版本..." >> $RESULTS_FILE
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  echo "✅ Git已安装: $GIT_VERSION" >> $RESULTS_FILE
else
  echo "❌ Git未安装" >> $RESULTS_FILE
  echo "❌ Git未安装，请安装Git"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查项目目录结构
echo "检查项目目录结构..." >> $RESULTS_FILE
REQUIRED_DIRS=("app" "src" "docs" "public" "capacitor" "tools")
MISSING_DIRS=()

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    MISSING_DIRS+=("$dir")
  fi
done

if [ ${#MISSING_DIRS[@]} -eq 0 ]; then
  echo "✅ 项目目录结构完整" >> $RESULTS_FILE
else
  echo "❌ 项目目录结构不完整，缺少以下目录:" >> $RESULTS_FILE
  for dir in "${MISSING_DIRS[@]}"; do
    echo "  - $dir" >> $RESULTS_FILE
  done
  echo "❌ 项目目录结构不完整，请运行 'bash docs/tasks/init-project.sh' 初始化项目"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查package.json文件
echo "检查package.json文件..." >> $RESULTS_FILE
if [ -f "package.json" ]; then
  echo "✅ package.json文件存在" >> $RESULTS_FILE
else
  echo "❌ package.json文件不存在" >> $RESULTS_FILE
  echo "❌ package.json文件不存在，请运行 'bash docs/tasks/init-project.sh' 初始化项目"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查node_modules目录
echo "检查node_modules目录..." >> $RESULTS_FILE
if [ -d "node_modules" ]; then
  echo "✅ node_modules目录存在" >> $RESULTS_FILE
else
  echo "❌ node_modules目录不存在" >> $RESULTS_FILE
  echo "❌ node_modules目录不存在，请运行 'bash docs/tasks/install-dependencies.sh' 安装依赖"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查Python环境
echo "检查Python环境..." >> $RESULTS_FILE
if [ -d "venv" ]; then
  echo "✅ Python虚拟环境存在" >> $RESULTS_FILE
else
  echo "⚠️ Python虚拟环境不存在" >> $RESULTS_FILE
  echo "⚠️ Python虚拟环境不存在，如需使用工具脚本，请运行 'bash docs/tasks/setup-python-env.sh' 设置Python环境"
fi
echo "" >> $RESULTS_FILE

# 检查.git目录
echo "检查Git仓库..." >> $RESULTS_FILE
if [ -d ".git" ]; then
  echo "✅ Git仓库已初始化" >> $RESULTS_FILE
  
  # 检查Git分支
  CURRENT_BRANCH=$(git branch --show-current)
  echo "当前分支: $CURRENT_BRANCH" >> $RESULTS_FILE
  
  # 检查main和develop分支是否存在
  if git show-ref --verify --quiet refs/heads/main; then
    echo "✅ main分支存在" >> $RESULTS_FILE
  else
    echo "❌ main分支不存在" >> $RESULTS_FILE
    echo "❌ main分支不存在，请运行 'bash docs/tasks/init-git-repo.sh' 初始化Git仓库"
  fi
  
  if git show-ref --verify --quiet refs/heads/develop; then
    echo "✅ develop分支存在" >> $RESULTS_FILE
  else
    echo "❌ develop分支不存在" >> $RESULTS_FILE
    echo "❌ develop分支不存在，请运行 'bash docs/tasks/init-git-repo.sh' 初始化Git仓库"
  fi
else
  echo "❌ Git仓库未初始化" >> $RESULTS_FILE
  echo "❌ Git仓库未初始化，请运行 'bash docs/tasks/init-git-repo.sh' 初始化Git仓库"
fi
echo "" >> $RESULTS_FILE

# 创建或更新.env.local文件中的初始化标记
if [ ! -f ".env.local" ]; then
  echo "创建.env.local文件..." >> $RESULTS_FILE
  echo "NEXT_PUBLIC_ENV_INITIALIZED=true" > .env.local
  echo "✅ .env.local文件创建成功" >> $RESULTS_FILE
else
  # 检查是否已包含初始化标记
  if grep -q "NEXT_PUBLIC_ENV_INITIALIZED=" ".env.local"; then
    # 更新初始化标记
    sed -i 's/NEXT_PUBLIC_ENV_INITIALIZED=.*/NEXT_PUBLIC_ENV_INITIALIZED=true/' .env.local
    echo "✅ .env.local文件中的初始化标记已更新" >> $RESULTS_FILE
  else
    # 添加初始化标记
    echo "NEXT_PUBLIC_ENV_INITIALIZED=true" >> .env.local
    echo "✅ 初始化标记已添加到.env.local文件" >> $RESULTS_FILE
  fi
fi
echo "" >> $RESULTS_FILE

# 创建环境检查结果
echo "" >> $RESULTS_FILE
echo "环境检查完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "如果发现任何问题，请按照提示修复。" >> $RESULTS_FILE
echo "如需重新初始化项目，请按顺序运行以下命令：" >> $RESULTS_FILE
echo "1. bash docs/tasks/init-project.sh" >> $RESULTS_FILE
echo "2. bash docs/tasks/init-git-repo.sh" >> $RESULTS_FILE
echo "3. bash docs/tasks/install-dependencies.sh" >> $RESULTS_FILE
echo "4. bash docs/tasks/setup-python-env.sh (可选，用于工具脚本)" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 环境检查完成！请查看 $RESULTS_FILE 文件了解详细信息。"
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_ENV_INITIALIZED=true" ".env.local"; then
  echo "✅ 项目环境已初始化。"
else
  echo "⚠️ 项目环境初始化可能不完整，请查看检查结果。"
fi 