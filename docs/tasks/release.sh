#!/bin/bash

# 发布脚本
# 该脚本执行应用的发布过程

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ 请提供版本号，例如: bash docs/tasks/release.sh 1.0.0"
  exit 1
fi

echo "🚀 开始发布版本 v$VERSION..."

# 检查是否在main分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ 当前不在main分支，请切换到main分支"
  exit 1
fi

# 检查标签是否存在
if ! git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "❌ 标签v$VERSION不存在，请先创建标签"
  exit 1
fi

# 构建Web版本
echo "🏗️ 构建Web版本..."
bun run build:static

if [ $? -ne 0 ]; then
  echo "❌ Web版本构建失败"
  exit 1
fi

# 部署Web版本
echo "🚢 部署Web版本到生产环境..."
bun run deploy:prod

if [ $? -ne 0 ]; then
  echo "❌ Web版本部署失败"
  exit 1
fi

# 构建移动应用
echo "📱 准备构建移动应用..."

# 更新Capacitor配置
echo "⚙️ 更新Capacitor配置..."
# 这里可以添加自动更新capacitor.config.ts的代码

# 同步Capacitor
echo "🔄 同步Capacitor配置..."
bun run cap:sync

# 构建Android应用
echo "🤖 构建Android应用..."
echo "请手动完成以下步骤:"
echo "1. 运行 'bun run cap:android' 打开Android Studio"
echo "2. 在Android Studio中选择 'Build > Generate Signed Bundle/APK'"
echo "3. 选择Android App Bundle (AAB)"
echo "4. 配置签名密钥"
echo "5. 选择release构建变体"
echo "6. 完成构建"
echo ""
read -p "Android应用构建完成后按Enter继续..."

# 构建iOS应用
echo "🍎 构建iOS应用..."
echo "请手动完成以下步骤:"
echo "1. 运行 'bun run cap:ios' 打开Xcode"
echo "2. 在Xcode中选择Generic iOS Device"
echo "3. 选择 'Product > Archive'"
echo "4. 等待归档完成"
echo "5. 在归档窗口中选择 'Distribute App'"
echo ""
read -p "iOS应用构建完成后按Enter继续..."

# 创建GitHub发布
echo "🏷️ 创建GitHub发布..."
echo "请手动完成以下步骤:"
echo "1. 访问GitHub仓库页面"
echo "2. 导航到Releases"
echo "3. 点击'Draft a new release'"
echo "4. 选择标签v$VERSION"
echo "5. 填写发布标题和说明（基于CHANGELOG）"
echo "6. 上传Android和iOS应用包（如适用）"
echo "7. 发布"
echo ""
read -p "GitHub发布创建完成后按Enter继续..."

# 提交应用商店
echo "🏪 提交应用到应用商店..."
echo "请手动完成以下步骤:"
echo "1. 登录Google Play Console和App Store Connect"
echo "2. 创建新版本"
echo "3. 上传应用包"
echo "4. 填写发布说明"
echo "5. 提交审核"
echo ""
read -p "应用提交完成后按Enter继续..."

# 发布完成
echo "✅ 发布流程完成！"
echo "请持续监控以下内容:"
echo "1. 应用商店审核状态"
echo "2. 生产环境应用性能"
echo "3. 用户反馈和应用商店评论"
echo ""
echo "如发现严重问题，请准备热修复:"
echo "1. 从main分支创建hotfix分支: git checkout -b hotfix/v$VERSION.1"
echo "2. 修复问题并提交"
echo "3. 更新版本号"
echo "4. 按照发布流程发布新版本" 