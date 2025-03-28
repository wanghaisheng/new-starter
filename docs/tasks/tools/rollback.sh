#!/bin/bash

# 回滚脚本
# 该脚本在发布出现严重问题时执行回滚操作

VERSION=$1
ROLLBACK_VERSION=$2

if [ -z "$VERSION" ] || [ -z "$ROLLBACK_VERSION" ]; then
  echo "❌ 请提供当前版本和回滚目标版本，例如: bash docs/tasks/rollback.sh 1.0.1 1.0.0"
  exit 1
fi

echo "⚠️ 准备将版本v$VERSION回滚到v$ROLLBACK_VERSION..."
echo "此操作将回滚生产环境，请确认是否继续？"
read -p "输入'yes'确认回滚: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 回滚操作已取消"
  exit 1
fi

# 检查回滚版本标签是否存在
if ! git rev-parse "v$ROLLBACK_VERSION" >/dev/null 2>&1; then
  echo "❌ 回滚目标标签v$ROLLBACK_VERSION不存在"
  exit 1
fi

# 切换到回滚版本
echo "🔙 切换到回滚版本v$ROLLBACK_VERSION..."
git checkout "v$ROLLBACK_VERSION"

# 构建Web版本
echo "🏗️ 构建回滚版本的Web应用..."
bun install
bun run build:static

if [ $? -ne 0 ]; then
  echo "❌ 回滚版本构建失败"
  git checkout main
  exit 1
fi

# 部署Web版本
echo "🚢 部署回滚版本到生产环境..."
bun run deploy:prod

if [ $? -ne 0 ]; then
  echo "❌ 回滚版本部署失败"
  git checkout main
  exit 1
fi

# 移动应用回滚
echo "📱 移动应用回滚..."
echo "请手动完成以下步骤:"
echo "1. 在Google Play Console中停止当前版本发布"
echo "2. 在App Store Connect中停止当前版本发布"
echo "3. 如果可能，恢复之前的版本发布"
echo ""
read -p "移动应用回滚操作完成后按Enter继续..."

# 创建回滚通知
echo "📣 创建回滚通知..."
echo "请手动完成以下步骤:"
echo "1. 通知用户关于回滚的信息"
echo "2. 更新相关文档和发布说明"
echo "3. 在监控系统中标记回滚事件"
echo ""
read -p "回滚通知创建完成后按Enter继续..."

# 回到主分支
git checkout main

# 创建回滚记录
echo "📝 创建回滚记录..."
echo "v$VERSION回滚到v$ROLLBACK_VERSION - $(date)" >> docs/rollback-history.md

echo "✅ 回滚操作完成！"
echo "请持续监控系统状态，确保回滚版本正常运行。"
echo "然后，创建热修复分支修复原版本中的问题。" 