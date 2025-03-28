#!/bin/bash

# 脚本生成器工具
# 该工具将任务计划文档转换为可执行的bash脚本

# 输出文件
RESULTS_FILE="docs/tasks/script-generation-results.txt"

# 清空或创建结果文件
echo "脚本生成结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查参数
if [ "$#" -ne 2 ]; then
    echo "用法: $0 <任务计划文件> <输出脚本名称>"
    echo "示例: $0 docs/tasks/tinder-app-starter-plan.md setup-tinder-app"
    exit 1
fi

TASK_PLAN_FILE="$1"
SCRIPT_NAME="$2"

# 检查任务计划文件是否存在
if [ ! -f "$TASK_PLAN_FILE" ]; then
    echo "❌ 任务计划文件 $TASK_PLAN_FILE 不存在" >> $RESULTS_FILE
    exit 1
fi

# 创建脚本文件
SCRIPT_FILE="docs/tasks/$SCRIPT_NAME.sh"
echo "#!/bin/bash" > "$SCRIPT_FILE"
echo "" >> "$SCRIPT_FILE"
echo "# 脚本名称：$SCRIPT_NAME" >> "$SCRIPT_FILE"
echo "# 描述：根据任务计划 $TASK_PLAN_FILE 自动生成的脚本" >> "$SCRIPT_FILE"
echo "# 作者：脚本生成器" >> "$SCRIPT_FILE"
echo "# 创建日期：$(date)" >> "$SCRIPT_FILE"
echo "" >> "$SCRIPT_FILE"

# 添加结果文件定义
echo "# 输出文件" >> "$SCRIPT_FILE"
echo "RESULTS_FILE=\"docs/tasks/$SCRIPT_NAME-results.txt\"" >> "$SCRIPT_FILE"
echo "" >> "$SCRIPT_FILE"

# 添加结果文件初始化
echo "# 清空或创建结果文件" >> "$SCRIPT_FILE"
echo "echo \"$SCRIPT_NAME 执行结果报告\" > \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"=========================\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"执行时间: \$(date)\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"

# 解析任务计划并生成脚本
echo "# 检查前置条件..." >> "$SCRIPT_FILE"
echo "echo \"检查前置条件...\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"

# 添加前置条件检查函数
cat >> "$SCRIPT_FILE" << 'EOL'
check_file_exists() {
  if [ ! -f "$1" ]; then
    echo "❌ 文件 $1 不存在" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 文件 $1 存在" >> $RESULTS_FILE
  return 0
}

check_directory_exists() {
  if [ ! -d "$1" ]; then
    echo "❌ 目录 $1 不存在" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 目录 $1 存在" >> $RESULTS_FILE
  return 0
}

check_dependency() {
  if ! bun list | grep -q "$1"; then
    echo "❌ 依赖 $1 未安装" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 依赖 $1 已安装" >> $RESULTS_FILE
  return 0
}
EOL

# 解析任务计划文件
while IFS= read -r line; do
    # 跳过空行和注释
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    
    # 检查是否是任务标题
    if [[ "$line" =~ ^[0-9]+\.[[:space:]]+(.+)$ ]]; then
        task_title="${BASH_REMATCH[1]}"
        echo "" >> "$SCRIPT_FILE"
        echo "# $task_title" >> "$SCRIPT_FILE"
        echo "echo \"执行任务: $task_title...\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
    # 检查是否是子任务
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]+(.+)$ ]]; then
        subtask="${BASH_REMATCH[1]}"
        
        # 根据子任务类型生成相应的脚本
        if [[ "$subtask" =~ ^创建目录[[:space:]]+(.+)$ ]]; then
            dir_path="${BASH_REMATCH[1]}"
            echo "check_directory_exists \"$dir_path\" || mkdir -p \"$dir_path\"" >> "$SCRIPT_FILE"
        elif [[ "$subtask" =~ ^安装依赖[[:space:]]+(.+)$ ]]; then
            package="${BASH_REMATCH[1]}"
            echo "check_dependency \"$package\" || bun add \"$package\"" >> "$SCRIPT_FILE"
        elif [[ "$subtask" =~ ^创建文件[[:space:]]+(.+)$ ]]; then
            file_path="${BASH_REMATCH[1]}"
            echo "check_file_exists \"$file_path\" || touch \"$file_path\"" >> "$SCRIPT_FILE"
        else
            echo "# TODO: 处理子任务: $subtask" >> "$SCRIPT_FILE"
        fi
    fi
done < "$TASK_PLAN_FILE"

# 添加验证步骤
echo "" >> "$SCRIPT_FILE"
echo "# 验证执行结果..." >> "$SCRIPT_FILE"
echo "echo \"验证执行结果...\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"

# 添加清理步骤
echo "" >> "$SCRIPT_FILE"
echo "# 清理工作..." >> "$SCRIPT_FILE"
echo "echo \"执行清理工作...\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"

# 添加完成信息
echo "" >> "$SCRIPT_FILE"
echo "echo \"\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"任务执行完成！\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"=========================\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"下一步：\" >> \$RESULTS_FILE" >> "$SCRIPT_FILE"
echo "echo \"1. 检查执行结果文件 \$RESULTS_FILE\"" >> "$SCRIPT_FILE"
echo "echo \"2. 如有错误，请查看错误信息并修复\"" >> "$SCRIPT_FILE"
echo "echo \"3. 确认所有任务已完成\"" >> "$SCRIPT_FILE"

# 添加控制台输出
echo "" >> "$SCRIPT_FILE"
echo "# 输出到控制台" >> "$SCRIPT_FILE"
echo "echo \"✅ 任务执行完成！请查看 \$RESULTS_FILE 文件了解详细信息。\"" >> "$SCRIPT_FILE"
echo "echo \"下一步：\"" >> "$SCRIPT_FILE"
echo "echo \"1. 检查执行结果文件 \$RESULTS_FILE\"" >> "$SCRIPT_FILE"
echo "echo \"2. 如有错误，请查看错误信息并修复\"" >> "$SCRIPT_FILE"
echo "echo \"3. 确认所有任务已完成\"" >> "$SCRIPT_FILE"

# 添加执行权限
chmod +x "$SCRIPT_FILE"

echo "✅ 已生成脚本 $SCRIPT_FILE" >> $RESULTS_FILE
echo "✅ 脚本生成完成！请查看 $RESULTS_FILE 文件了解详细信息。" 