#!/bin/bash

# 项目文档索引创建脚本
# 该脚本创建项目文档的索引，帮助开发者快速找到所需的文档

# 输出文件
INDEX_FILE="docs/README.md"

# 清空或创建索引文件
echo "# 项目文档索引" > $INDEX_FILE
echo "" >> $INDEX_FILE
echo "本文档提供了项目中所有文档的索引，帮助开发者快速找到所需的文档。" >> $INDEX_FILE
echo "" >> $INDEX_FILE
echo "## 项目指南" >> $INDEX_FILE
echo "" >> $INDEX_FILE

# 添加项目指南
if [ -f "docs/project-initialization-guide.md" ]; then
  echo "- [项目初始化指南](./project-initialization-guide.md) - 项目初始化的步骤和说明" >> $INDEX_FILE
fi

if [ -f "docs/development-process-guide.md" ]; then
  echo "- [开发流程指南](./development-process-guide.md) - 项目开发流程的说明" >> $INDEX_FILE
fi

if [ -f "docs/git-branch-strategy.md" ]; then
  echo "- [Git分支策略](./git-branch-strategy.md) - 项目Git分支策略的说明" >> $INDEX_FILE
fi

echo "" >> $INDEX_FILE
echo "## 模板文档" >> $INDEX_FILE
echo "" >> $INDEX_FILE

# 添加模板文档
for file in docs/templates/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //')
    echo "- [${title}](./templates/${filename}) - $(sed -n '3p' "$file" | sed 's/^//')" >> $INDEX_FILE
  fi
done

echo "" >> $INDEX_FILE
echo "## 任务脚本" >> $INDEX_FILE
echo "" >> $INDEX_FILE

# 添加任务脚本
for file in docs/tasks/*.sh; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    description=$(grep -m 1 "# 该脚本" "$file" | sed 's/# 该脚本//')
    echo "- [\`${filename}\`](./tasks/${filename}) -${description}" >> $INDEX_FILE
  fi
done

echo "" >> $INDEX_FILE
echo "## 项目状态" >> $INDEX_FILE
echo "" >> $INDEX_FILE

# 添加项目状态文档
if [ -f "docs/project-progress.md" ]; then
  echo "- [项目进度报告](./project-progress.md) - 项目的当前进度和完成的任务" >> $INDEX_FILE
fi

if [ -f "docs/project-status.md" ]; then
  echo "- [项目状态报告](./project-status.md) - 项目的当前状态和检查结果" >> $INDEX_FILE
fi

echo "" >> $INDEX_FILE
echo "## 其他文档" >> $INDEX_FILE
echo "" >> $INDEX_FILE

# 添加其他文档
for file in docs/*.md; do
  if [ -f "$file" ] && [ "$file" != "docs/README.md" ] && [ "$file" != "docs/project-progress.md" ] && [ "$file" != "docs/project-status.md" ] && [ "$file" != "docs/project-initialization-guide.md" ] && [ "$file" != "docs/development-process-guide.md" ] && [ "$file" != "docs/git-branch-strategy.md" ]; then
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //')
    echo "- [${title}](./${filename})" >> $INDEX_FILE
  fi
done

echo "" >> $INDEX_FILE
echo "## 使用指南" >> $INDEX_FILE
echo "" >> $INDEX_FILE
echo "1. 在开始开发前，请先阅读[项目初始化指南](./project-initialization-guide.md)和[开发流程指南](./development-process-guide.md)" >> $INDEX_FILE
echo "2. 创建新功能时，请使用[功能任务计划模板](./templates/feature-task-plan-template.md)" >> $INDEX_FILE
echo "3. 提交代码时，请使用[\`commit-code.sh\`](./tasks/commit-code.sh)脚本" >> $INDEX_FILE
echo "4. 发布应用时，请遵循[应用发布工作流程](./templates/app-release-workflow.md)" >> $INDEX_FILE
echo "5. 定期运行[\`check-project-status.sh\`](./tasks/check-project-status.sh)检查项目状态" >> $INDEX_FILE
echo "6. 定期运行[\`update-project-progress.sh\`](./tasks/update-project-progress.sh)更新项目进度" >> $INDEX_FILE

echo "✅ 项目文档索引已创建！请查看 $INDEX_FILE 文件了解详细信息。" 