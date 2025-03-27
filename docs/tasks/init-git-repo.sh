#!/bin/bash

# Git仓库初始化脚本
# 该脚本初始化Git仓库并创建必要的分支

# 输出文件
RESULTS_FILE="docs/tasks/git-init-results.txt"

# 清空或创建结果文件
echo "Git仓库初始化结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Git是否已安装
echo "检查Git是否已安装..." >> $RESULTS_FILE
if ! command -v git &> /dev/null; then
  echo "❌ Git未安装，请先安装Git" >> $RESULTS_FILE
  echo "❌ Git未安装，请先安装Git"
  exit 1
else
  GIT_VERSION=$(git --version)
  echo "✅ Git已安装: $GIT_VERSION" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 检查是否已经初始化Git仓库
echo "检查是否已经初始化Git仓库..." >> $RESULTS_FILE
if [ -d ".git" ]; then
  echo "⚠️ Git仓库已存在，跳过初始化" >> $RESULTS_FILE
  
  # 检查是否有远程仓库
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$REMOTE_URL" ]; then
    echo "✅ 远程仓库已配置: $REMOTE_URL" >> $RESULTS_FILE
  else
    echo "⚠️ 未配置远程仓库" >> $RESULTS_FILE
  fi
  
  # 检查分支
  CURRENT_BRANCH=$(git branch --show-current)
  echo "当前分支: $CURRENT_BRANCH" >> $RESULTS_FILE
  
  # 检查main和develop分支是否存在
  if git show-ref --verify --quiet refs/heads/main; then
    echo "✅ main分支已存在" >> $RESULTS_FILE
  else
    echo "❌ main分支不存在，将创建main分支" >> $RESULTS_FILE
    git branch main
    echo "✅ main分支创建完成" >> $RESULTS_FILE
  fi
  
  if git show-ref --verify --quiet refs/heads/develop; then
    echo "✅ develop分支已存在" >> $RESULTS_FILE
  else
    echo "❌ develop分支不存在，将创建develop分支" >> $RESULTS_FILE
    git branch develop
    echo "✅ develop分支创建完成" >> $RESULTS_FILE
  fi
else
  echo "初始化Git仓库..." >> $RESULTS_FILE
  git init
  echo "✅ Git仓库初始化完成" >> $RESULTS_FILE
  
  # 创建.gitattributes文件
  echo "创建.gitattributes文件..." >> $RESULTS_FILE
  cat > .gitattributes << 'EOL'
# 自动检测文本文件并执行LF标准化
* text=auto

# 源代码
*.css text
*.html text
*.js text
*.json text
*.jsx text
*.ts text
*.tsx text
*.md text
*.mdx text
*.scss text
*.svg text
*.yml text

# 文档
*.pdf binary
*.doc binary
*.docx binary
*.ppt binary
*.pptx binary
*.xls binary
*.xlsx binary

# 图片
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary

# 字体
*.eot binary
*.ttf binary
*.woff binary
*.woff2 binary

# 音视频
*.mp3 binary
*.mp4 binary
*.webm binary
*.ogg binary
EOL
  echo "✅ .gitattributes文件创建完成" >> $RESULTS_FILE
  
  # 创建main分支
  echo "创建main分支..." >> $RESULTS_FILE
  git checkout -b main
  echo "✅ main分支创建完成" >> $RESULTS_FILE
  
  # 添加所有文件并提交
  echo "添加所有文件并提交..." >> $RESULTS_FILE
  git add .
  git commit -m "初始化项目"
  echo "✅ 初始提交完成" >> $RESULTS_FILE
  
  # 创建develop分支
  echo "创建develop分支..." >> $RESULTS_FILE
  git checkout -b develop
  echo "✅ develop分支创建完成" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 创建Git钩子
echo "创建Git钩子..." >> $RESULTS_FILE
mkdir -p .git/hooks

# 创建pre-commit钩子
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash

# 运行ESLint检查
echo "运行ESLint检查..."
npx eslint . --ext .js,.jsx,.ts,.tsx

# 如果ESLint检查失败，阻止提交
if [ $? -ne 0 ]; then
  echo "❌ ESLint检查失败，请修复上述问题后再提交"
  exit 1
fi

# 运行TypeScript类型检查
echo "运行TypeScript类型检查..."
npx tsc --noEmit

# 如果TypeScript类型检查失败，阻止提交
if [ $? -ne 0 ]; then
  echo "❌ TypeScript类型检查失败，请修复上述问题后再提交"
  exit 1
fi

echo "✅ 代码检查通过"
exit 0
EOL

# 设置钩子可执行权限
chmod +x .git/hooks/pre-commit
echo "✅ pre-commit钩子创建完成" >> $RESULTS_FILE

# 创建commit-msg钩子
cat > .git/hooks/commit-msg << 'EOL'
#!/bin/bash

# 获取提交消息
commit_msg=$(cat "$1")

# 检查提交消息格式
if ! echo "$commit_msg" | grep -qE '^(feat|fix|docs|style|refactor|test|chore|ci|build|perf|i18n)(\([a-z0-9-]+\))?: .+'; then
  echo "❌ 提交消息格式不正确"
  echo "正确格式: <type>(<scope>): <subject>"
  echo "类型必须是: feat, fix, docs, style, refactor, test, chore, ci, build, perf, i18n"
  echo "示例: feat(auth): 添加社交媒体登录功能"
  exit 1
fi

echo "✅ 提交消息格式正确"
exit 0
EOL

# 设置钩子可执行权限
chmod +x .git/hooks/commit-msg
echo "✅ commit-msg钩子创建完成" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 创建Git仓库初始化结果
echo "" >> $RESULTS_FILE
echo "Git仓库初始化完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bash docs/tasks/install-dependencies.sh' 安装依赖" >> $RESULTS_FILE
echo "2. 配置远程仓库: git remote add origin <repository-url>" >> $RESULTS_FILE
echo "3. 推送到远程仓库: git push -u origin main" >> $RESULTS_FILE

# 输出到控制台
echo "✅ Git仓库初始化完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bash docs/tasks/install-dependencies.sh' 安装依赖"
echo "2. 配置远程仓库: git remote add origin <repository-url>"
echo "3. 推送到远程仓库: git push -u origin main" 