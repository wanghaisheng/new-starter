#!/bin/bash

# 代码提交脚本
# 该脚本规范代码提交流程

# 检查Git是否已安装
if ! command -v git &> /dev/null; then
  echo "❌ Git未安装，请先安装Git"
  exit 1
fi

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
  echo "❌ 没有需要提交的更改"
  exit 1
fi

# 显示未提交的更改
echo "未提交的更改:"
git status -s

# 提示用户输入提交类型
echo ""
echo "请选择提交类型:"
echo "1) feat:     新功能"
echo "2) fix:      修复Bug"
echo "3) docs:     文档更新"
echo "4) style:    代码风格调整"
echo "5) refactor: 代码重构"
echo "6) test:     测试相关"
echo "7) chore:    构建过程或辅助工具的变动"
echo "8) ci:       CI配置变更"
echo "9) build:    构建系统或外部依赖变更"
echo "10) i18n:    国际化相关"
read -p "请输入选项 (1-10): " type_option

# 根据选项设置提交类型
case $type_option in
  1) commit_type="feat" ;;
  2) commit_type="fix" ;;
  3) commit_type="docs" ;;
  4) commit_type="style" ;;
  5) commit_type="refactor" ;;
  6) commit_type="test" ;;
  7) commit_type="chore" ;;
  8) commit_type="ci" ;;
  9) commit_type="build" ;;
  10) commit_type="i18n" ;;
  *) 
    echo "❌ 无效选项"
    exit 1
    ;;
esac

# 提示用户输入作用域
read -p "请输入作用域 (可选，例如: auth, ui): " scope

# 提示用户输入提交信息
read -p "请输入提交信息: " message

# 构建提交消息
if [ -n "$scope" ]; then
  commit_message="$commit_type($scope): $message"
else
  commit_message="$commit_type: $message"
fi

# 显示最终的提交消息
echo ""
echo "最终提交消息:"
echo "$commit_message"
echo ""

# 确认提交
read -p "确认提交? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "❌ 已取消提交"
  exit 1
fi

# 由于Cursor的限制，将提交消息写入临时文件
TEMP_FILE=".commit_msg_temp"
echo "$commit_message" > $TEMP_FILE

# 执行提交
git add .
git commit -F $TEMP_FILE

# 删除临时文件
rm $TEMP_FILE

# 提示推送
echo ""
echo "✅ 提交成功"
echo "如需推送到远程仓库，请执行:"
echo "git push origin $(git branch --show-current)" 