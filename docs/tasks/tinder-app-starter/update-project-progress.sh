#!/bin/bash

# 项目进度更新脚本
# 该脚本用于记录项目的当前状态和完成的任务

# 输出文件
PROGRESS_FILE="docs/project-progress.md"

# 检查是否存在进度文件，如果不存在则创建
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# 项目进度报告" > $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "## 项目概述" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "- **项目名称**: Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目" >> $PROGRESS_FILE
  echo "- **版本**: 1.0.0" >> $PROGRESS_FILE
  echo "- **最后更新**: $(date +"%Y-%m-%d %H:%M")" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "## 已完成任务" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "## 进行中任务" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "## 待办任务" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
  echo "## 问题与解决方案" >> $PROGRESS_FILE
  echo "" >> $PROGRESS_FILE
else
  # 更新最后更新时间
  sed -i "s/- \*\*最后更新\*\*:.*/- **最后更新**: $(date +"%Y-%m-%d %H:%M")/" $PROGRESS_FILE
fi

# 获取当前日期
CURRENT_DATE=$(date +"%Y-%m-%d")

# 添加已完成任务
add_completed_task() {
  local task="$1"
  local date="$2"
  
  # 检查任务是否已存在
  if grep -q "$task" $PROGRESS_FILE; then
    echo "任务 '$task' 已存在，跳过添加"
  else
    # 在"已完成任务"部分添加新任务
    sed -i "/^## 已完成任务/a - \[$date\] $task" $PROGRESS_FILE
    echo "已添加完成任务: $task"
  fi
}

# 添加进行中任务
add_in_progress_task() {
  local task="$1"
  
  # 检查任务是否已存在
  if grep -q "$task" $PROGRESS_FILE; then
    echo "任务 '$task' 已存在，跳过添加"
  else
    # 在"进行中任务"部分添加新任务
    sed -i "/^## 进行中任务/a - $task" $PROGRESS_FILE
    echo "已添加进行中任务: $task"
  fi
}

# 添加待办任务
add_todo_task() {
  local task="$1"
  
  # 检查任务是否已存在
  if grep -q "$task" $PROGRESS_FILE; then
    echo "任务 '$task' 已存在，跳过添加"
  else
    # 在"待办任务"部分添加新任务
    sed -i "/^## 待办任务/a - $task" $PROGRESS_FILE
    echo "已添加待办任务: $task"
  fi
}

# 添加问题与解决方案
add_issue_solution() {
  local issue="$1"
  local solution="$2"
  local date="$3"
  
  # 检查问题是否已存在
  if grep -q "$issue" $PROGRESS_FILE; then
    echo "问题 '$issue' 已存在，跳过添加"
  else
    # 在"问题与解决方案"部分添加新问题
    sed -i "/^## 问题与解决方案/a ### $issue ($date)\n\n$solution\n" $PROGRESS_FILE
    echo "已添加问题与解决方案: $issue"
  fi
}

# 更新项目进度
echo "更新项目进度..."

# 添加已完成的任务
add_completed_task "项目初始化" "$CURRENT_DATE"
add_completed_task "创建项目目录结构" "$CURRENT_DATE"
add_completed_task "配置Next.js" "$CURRENT_DATE"
add_completed_task "配置Tailwind CSS" "$CURRENT_DATE"
add_completed_task "配置Capacitor" "$CURRENT_DATE"
add_completed_task "创建基础页面" "$CURRENT_DATE"
add_completed_task "创建移动端标签页" "$CURRENT_DATE"
add_completed_task "创建Web版仪表盘" "$CURRENT_DATE"
add_completed_task "配置Ionic Provider" "$CURRENT_DATE"
add_completed_task "创建发布工作流程文档" "$CURRENT_DATE"
add_completed_task "创建发布脚本" "$CURRENT_DATE"
add_completed_task "创建回滚脚本" "$CURRENT_DATE"

# 添加进行中的任务
add_in_progress_task "完善移动端UI组件"
add_in_progress_task "优化Web版仪表盘"
add_in_progress_task "集成身份验证功能"

# 添加待办任务
add_todo_task "实现数据持久化"
add_todo_task "添加离线支持"
add_todo_task "实现推送通知"
add_todo_task "添加单元测试"
add_todo_task "添加E2E测试"
add_todo_task "优化性能"
add_todo_task "添加国际化支持"

# 添加问题与解决方案
add_issue_solution "移动端路由404错误" "创建了移动端页面创建脚本，添加了必要的路由页面和组件" "$CURRENT_DATE"
add_issue_solution "依赖安装失败" "创建了依赖修复脚本，提供了多种安装方式和故障排除步骤" "$CURRENT_DATE"

echo "✅ 项目进度已更新！请查看 $PROGRESS_FILE 文件了解详细信息。" 