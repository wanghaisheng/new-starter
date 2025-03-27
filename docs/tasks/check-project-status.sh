#!/bin/bash

# 项目状态检查脚本
# 该脚本检查项目的当前状态并生成状态报告

# 输出文件
STATUS_FILE="docs/project-status.md"

# 清空或创建状态文件
echo "# 项目状态报告" > $STATUS_FILE
echo "" >> $STATUS_FILE
echo "生成时间: $(date)" >> $STATUS_FILE
echo "" >> $STATUS_FILE

# 检查环境
echo "## 环境状态" >> $STATUS_FILE
echo "" >> $STATUS_FILE

# 检查Node.js版本
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "- ✅ Node.js: $NODE_VERSION" >> $STATUS_FILE
else
  echo "- ❌ Node.js: 未安装" >> $STATUS_FILE
fi

# 检查bun版本
if command -v bun &> /dev/null; then
  BUN_VERSION=$(bun -v)
  echo "- ✅ bun: $BUN_VERSION" >> $STATUS_FILE
else
  echo "- ❌ bun: 未安装" >> $STATUS_FILE
fi

# 检查Git版本
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  echo "- ✅ Git: $GIT_VERSION" >> $STATUS_FILE
else
  echo "- ❌ Git: 未安装" >> $STATUS_FILE
fi

# 检查项目结构
echo "" >> $STATUS_FILE
echo "## 项目结构" >> $STATUS_FILE
echo "" >> $STATUS_FILE

# 检查关键目录
DIRECTORIES=("app" "src" "docs" "public" "capacitor")
for dir in "${DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "- ✅ $dir 目录存在" >> $STATUS_FILE
  else
    echo "- ❌ $dir 目录不存在" >> $STATUS_FILE
  fi
done

# 检查关键文件
echo "" >> $STATUS_FILE
echo "## 关键文件" >> $STATUS_FILE
echo "" >> $STATUS_FILE

FILES=("package.json" "next.config.js" "capacitor.config.ts" "tailwind.config.js" "tsconfig.json" ".env.local")
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "- ✅ $file 存在" >> $STATUS_FILE
  else
    echo "- ❌ $file 不存在" >> $STATUS_FILE
  fi
done

# 检查依赖
echo "" >> $STATUS_FILE
echo "## 依赖状态" >> $STATUS_FILE
echo "" >> $STATUS_FILE

if [ -d "node_modules" ]; then
  echo "- ✅ node_modules 目录存在" >> $STATUS_FILE
  
  # 检查关键依赖
  DEPENDENCIES=("next" "react" "react-dom" "@ionic/react" "@capacitor/core")
  for dep in "${DEPENDENCIES[@]}"; do
    if [ -d "node_modules/$dep" ]; then
      echo "  - ✅ $dep 已安装" >> $STATUS_FILE
    else
      echo "  - ❌ $dep 未安装" >> $STATUS_FILE
    fi
  done
else
  echo "- ❌ node_modules 目录不存在，依赖可能未安装" >> $STATUS_FILE
fi

# 检查Git状态
echo "" >> $STATUS_FILE
echo "## Git状态" >> $STATUS_FILE
echo "" >> $STATUS_FILE

if [ -d ".git" ]; then
  echo "- ✅ Git仓库已初始化" >> $STATUS_FILE
  
  # 获取当前分支
  CURRENT_BRANCH=$(git branch --show-current)
  echo "- 当前分支: $CURRENT_BRANCH" >> $STATUS_FILE
  
  # 获取未提交的更改数量
  UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)
  if [ "$UNCOMMITTED_CHANGES" -eq 0 ]; then
    echo "- ✅ 工作目录干净，没有未提交的更改" >> $STATUS_FILE
  else
    echo "- ⚠️ 有 $UNCOMMITTED_CHANGES 个未提交的更改" >> $STATUS_FILE
  fi
else
  echo "- ❌ Git仓库未初始化" >> $STATUS_FILE
fi

# 检查页面状态
echo "" >> $STATUS_FILE
echo "## 页面状态" >> $STATUS_FILE
echo "" >> $STATUS_FILE

# 检查Web页面
if [ -f "app/page.tsx" ]; then
  echo "- ✅ 主页面存在" >> $STATUS_FILE
else
  echo "- ❌ 主页面不存在" >> $STATUS_FILE
fi

if [ -f "app/(web)/dashboard/page.tsx" ]; then
  echo "- ✅ Web仪表盘页面存在" >> $STATUS_FILE
else
  echo "- ❌ Web仪表盘页面不存在" >> $STATUS_FILE
fi

# 检查移动端页面
if [ -f "app/(mobile)/tabs/page.tsx" ]; then
  echo "- ✅ 移动端标签页存在" >> $STATUS_FILE
else
  echo "- ❌ 移动端标签页不存在" >> $STATUS_FILE
fi

if [ -f "app/(mobile)/tabs/home/page.tsx" ] && [ -f "app/(mobile)/tabs/profile/page.tsx" ] && [ -f "app/(mobile)/tabs/settings/page.tsx" ]; then
  echo "- ✅ 移动端所有标签内容页面存在" >> $STATUS_FILE
else
  echo "- ❌ 移动端部分标签内容页面缺失" >> $STATUS_FILE
fi

# 总结
echo "" >> $STATUS_FILE
echo "## 总结" >> $STATUS_FILE
echo "" >> $STATUS_FILE

# 计算检查项总数和通过数
TOTAL_CHECKS=$(grep -c "- ✅\|- ❌\|- ⚠️" $STATUS_FILE)
PASSED_CHECKS=$(grep -c "- ✅" $STATUS_FILE)
WARNING_CHECKS=$(grep -c "- ⚠️" $STATUS_FILE)
FAILED_CHECKS=$(grep -c "- ❌" $STATUS_FILE)

PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "- 总检查项: $TOTAL_CHECKS" >> $STATUS_FILE
echo "- 通过: $PASSED_CHECKS" >> $STATUS_FILE
echo "- 警告: $WARNING_CHECKS" >> $STATUS_FILE
echo "- 失败: $FAILED_CHECKS" >> $STATUS_FILE
echo "- 通过率: $PASS_PERCENTAGE%" >> $STATUS_FILE
echo "" >> $STATUS_FILE

if [ $PASS_PERCENTAGE -eq 100 ]; then
  echo "🎉 **项目状态良好，所有检查项均通过！**" >> $STATUS_FILE
elif [ $PASS_PERCENTAGE -ge 80 ]; then
  echo "👍 **项目状态良好，大部分检查项通过。**" >> $STATUS_FILE
elif [ $PASS_PERCENTAGE -ge 50 ]; then
  echo "⚠️ **项目状态一般，需要解决部分问题。**" >> $STATUS_FILE
else
  echo "❌ **项目状态不佳，需要解决大量问题。**" >> $STATUS_FILE
fi

echo "" >> $STATUS_FILE
echo "### 下一步建议" >> $STATUS_FILE
echo "" >> $STATUS_FILE

if [ $FAILED_CHECKS -gt 0 ]; then
  echo "1. 修复失败的检查项" >> $STATUS_FILE
  echo "2. 运行 'bash docs/tasks/check-project-status.sh' 重新检查项目状态" >> $STATUS_FILE
else
  echo "1. 继续开发新功能" >> $STATUS_FILE
  echo "2. 优化现有代码" >> $STATUS_FILE
  echo "3. 添加测试" >> $STATUS_FILE
fi

echo "✅ 项目状态检查完成！请查看 $STATUS_FILE 文件了解详细信息。" 