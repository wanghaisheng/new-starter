#!/bin/bash

# 任务执行器工具
# 该工具用于执行任务脚本并生成执行报告

# 输出文件
RESULTS_FILE="docs/tasks/task-execution-results.txt"

# 清空或创建结果文件
echo "任务执行结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查参数
if [ "$#" -ne 1 ]; then
    echo "用法: $0 <任务脚本路径>"
    echo "示例: $0 docs/tasks/setup-tinder-app.sh"
    exit 1
fi

SCRIPT_PATH="$1"

# 检查脚本文件是否存在
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ 脚本文件 $SCRIPT_PATH 不存在" >> $RESULTS_FILE
    exit 1
fi

# 检查脚本是否可执行
if [ ! -x "$SCRIPT_PATH" ]; then
    echo "❌ 脚本文件 $SCRIPT_PATH 没有执行权限" >> $RESULTS_FILE
    chmod +x "$SCRIPT_PATH"
    echo "✅ 已添加执行权限" >> $RESULTS_FILE
fi

# 执行脚本
echo "开始执行脚本: $SCRIPT_PATH" >> $RESULTS_FILE
echo "-------------------------" >> $RESULTS_FILE

# 记录脚本输出
{
    bash "$SCRIPT_PATH" 2>&1
} | tee -a "$RESULTS_FILE"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "✅ 脚本执行成功" >> $RESULTS_FILE
else
    echo "❌ 脚本执行失败" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "-------------------------" >> $RESULTS_FILE
echo "执行完成时间: $(date)" >> $RESULTS_FILE

# 生成执行报告
echo "" >> $RESULTS_FILE
echo "## 执行报告" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 统计成功和失败的任务
SUCCESS_COUNT=$(grep -c "✅" "$RESULTS_FILE")
FAILURE_COUNT=$(grep -c "❌" "$RESULTS_FILE")

echo "### 执行统计" >> $RESULTS_FILE
echo "- 成功任务数: $SUCCESS_COUNT" >> $RESULTS_FILE
echo "- 失败任务数: $FAILURE_COUNT" >> $RESULTS_FILE

# 提取错误信息
echo "" >> $RESULTS_FILE
echo "### 错误信息" >> $RESULTS_FILE
grep "❌" "$RESULTS_FILE" >> $RESULTS_FILE

# 提取警告信息
echo "" >> $RESULTS_FILE
echo "### 警告信息" >> $RESULTS_FILE
grep "⚠️" "$RESULTS_FILE" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 任务执行完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "执行统计："
echo "- 成功任务数: $SUCCESS_COUNT"
echo "- 失败任务数: $FAILURE_COUNT" 