#!/bin/bash

# 生成并导出规则提示词
export TRAE_DEFAULT_PROMPT="请严格遵循以下项目规范回答：\n$(cat docs/templates/coding-standards.md | grep -v '^#' | head -n 10)\n..."

# 遍历规则文件
while read -r rule; do
  file=$(echo "$rule" | awk '{print $1}')
  priority=$(echo "$rule" | awk '{print $2}')
  RULES_PROMPT+="\n# ${file} (优先级:${priority})\n"
  RULES_PROMPT+="$(cat "$file" | grep -v '^#' | head -n 5)\n..."
done < <(yq e '.rules[] | .path + " " + (.priority|tostring)' .trae-rules.yml | sort -k2 -nr)

# 保存到环境变量
echo "export TRAE_RULES_PROMPT='$RULES_PROMPT'" > .trae-rules-env