#!/bin/bash

# 脚本路径更新工具
# 该脚本批量更新development-process-guide.md中的bash脚本路径

# 目标文件
TARGET_FILE="d:/Download/audio-visual/heytcm/new-starter/docs/development-process-guide.md"
TEMP_FILE="${TARGET_FILE}.tmp"

# 备份原文件
cp "$TARGET_FILE" "${TARGET_FILE}.bak"

# 定义替换规则
declare -A REPLACEMENTS=(
    ["docs/tasks/check-environment.sh"]="docs/tasks/tools/check-environment.sh"
    ["docs/tasks/init-git-repo.sh"]="docs/tasks/tools/init-git-repo.sh"
    ["docs/tasks/install-dependencies.sh"]="docs/tasks/tools/install-dependencies.sh"
    ["docs/tasks/check-project-status.sh"]="docs/tasks/tools/check-project-status.sh"
    ["docs/tasks/commit-code.sh"]="docs/tasks/tools/commit-code.sh"
    ["docs/tasks/prepare-release.sh"]="docs/tasks/tools/prepare-release.sh"
    ["docs/tasks/release.sh"]="docs/tasks/tools/release.sh"
    ["docs/tasks/rollback.sh"]="docs/tasks/tools/rollback.sh"
    ["docs/tasks/setup-python-env.sh"]="docs/tasks/tools/setup-python-env.sh"
    ["docs/tasks/update-project-progress.sh"]="docs/tasks/tinder-app-starter/update-project-progress.sh"
    ["docs/tasks/fix-mobile-routes.sh"]="docs/tasks/tinder-app-starter/fix-mobile-routes.sh"
)

# 执行替换
while IFS= read -r line; do
    for old_path in "${!REPLACEMENTS[@]}"; do
        new_path="${REPLACEMENTS[$old_path]}"
        line="${line//$old_path/$new_path}"
    done
    echo "$line" >> "$TEMP_FILE"
done < "$TARGET_FILE"

# 替换原文件
mv "$TEMP_FILE" "$TARGET_FILE"

echo "✅ 脚本路径更新完成！原文件已备份为 ${TARGET_FILE}.bak"