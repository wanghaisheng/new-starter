#!/bin/bash

# 发布准备脚本
# 该脚本检查发布前的必要条件并准备发布环境

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ 请提供版本号，例如: bash docs/tasks/prepare-release.sh 1.0.0"
  exit 1
fi

echo "🚀 准备发布版本 v$VERSION..."

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作目录不干净，请提交或暂存所有更改"
  exit 1
fi

# 检查是否在develop分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "❌ 当前不在develop分支，请切换到develop分支"
  exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull

# 运行测试
echo "🧪 运行测试..."
bun test

if [ $? -ne 0 ]; then
  echo "❌ 测试失败，请修复测试后再尝试发布"
  exit 1
fi

# 更新版本号
echo "📝 更新版本号..."
bun version $VERSION

# 更新CHANGELOG
echo "📋 请更新CHANGELOG.md文件，然后按Enter继续..."
read

# 创建发布分支
echo "🌿 创建发布分支..."
git checkout -b release/v$VERSION

# 提交更改
git add package.json CHANGELOG.md
git commit -m "chore(release): prepare v$VERSION"

echo "✅ 发布准备完成！"
echo "下一步："
echo "1. 推送发布分支: git push origin release/v$VERSION"
echo "2. 创建Pull Request合并到main分支"
echo "3. 合并后，创建标签: git tag v$VERSION"
echo "4. 推送标签: git push origin v$VERSION"
echo "5. 运行发布脚本: bash docs/tasks/release.sh $VERSION" 