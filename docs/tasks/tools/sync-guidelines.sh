#!/bin/bash
# 同步guideline.md的核心规范到开发指南

SOURCE="d:/Download/audio-visual/heytcm/new-starter/guideline.md"
TARGET="d:/Download/audio-visual/heytcm/new-starter/docs/development-process-guide.md"
LOG_FILE="d:/Download/audio-visual/heytcm/new-starter/docs/tasks/tools/sync-guidelines.log"

# 创建日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始同步指南文档..."

# 1. 同步目录结构规范
log "同步目录结构规范..."
sed -n '/^```$/,/^```$/p' "$SOURCE" | sed '1d;$d' > temp_dir_structure.md
sed -i '/## 1.6 项目目录规范/r temp_dir_structure.md' "$TARGET"
rm temp_dir_structure.md

# 2. 更新移动端路由规范
log "更新移动端路由规范..."
sed -i 's/app\/(mobile)/app\/mobile/g' "$TARGET"

# 3. 添加脚本规范
log "添加脚本规范..."
cat << 'EOF' > temp_script_standards.md
### 1.5 自动化脚本

1. **脚本存放位置**：统一放在`docs/tasks/tools/`目录
2. **命名要求**：使用`<功能>-<操作>.sh`格式，如`setup-database.sh`
3. **输出规范**：
   - 成功执行应输出绿色✅标记
   - 失败应输出红色❌标记及解决建议
4. **结果记录**：自动生成`<脚本名>-<时间戳>.log`文件
EOF
sed -i '/## 1.4 版本控制/r temp_script_standards.md' "$TARGET"
rm temp_script_standards.md

# 4. 添加移动端专项说明
log "添加移动端专项说明..."
cat << 'EOF' > temp_mobile_standards.md
## 7. 移动端开发规范

### 7.1 路由结构
- 所有移动端路由必须放在`app/mobile`目录下
- 共享组件放在`src/core/components/`
- 移动端专属组件放在`src/mobile/components/`

### 7.2 插件封装
- 每个Capacitor插件应有对应的服务封装类
- 必须实现Web环境降级方案
EOF
# 修复错误：Windows环境下不使用内联方式，改为使用文件
log "将移动端规范插入到文档中..."
SECTION_LINE=$(grep -n "## 7. UI素材管理流程" "$TARGET" | cut -d: -f1)
if [ -n "$SECTION_LINE" ]; then
  head -n $((SECTION_LINE-1)) "$TARGET" > temp_file1.md
  cat temp_mobile_standards.md >> temp_file1.md
  tail -n +$SECTION_LINE "$TARGET" >> temp_file1.md
  mv temp_file1.md "$TARGET"
else
  # 如果找不到目标章节，则添加到文件末尾
  cat temp_mobile_standards.md >> "$TARGET"
fi
rm temp_mobile_standards.md

# 5. 添加版本控制强化
log "添加版本控制强化..."
cat > temp_version_control.md << 'EOFVC'
## 1.4 版本控制

### 提交消息格式：
- 类型(feat|fix|docs|style|refactor|test|chore): 简要描述
- 空行
- 详细说明（可选）
- 空行
- 关联问题编号（如Closes #123）

示例：
\`\`\`
feat: 添加用户认证模块

实现JWT基础认证流程
包含登录/注册/令牌刷新功能

Closes #45
\`\`\`
EOFVC

# 修复错误：使用文件替换而非sed命令
log "将版本控制规范插入到文档中..."
SECTION_LINE=$(grep -n "## 1.4 版本控制" "$TARGET" | cut -d: -f1)
if [ -n "$SECTION_LINE" ]; then
  head -n $((SECTION_LINE-1)) "$TARGET" > temp_file2.md
  cat temp_version_control.md >> temp_file2.md
  NEXT_SECTION_LINE=$(tail -n +$((SECTION_LINE+1)) "$TARGET" | grep -n "^##" | head -1 | cut -d: -f1)
  if [ -n "$NEXT_SECTION_LINE" ]; then
    tail -n +$((SECTION_LINE+NEXT_SECTION_LINE)) "$TARGET" >> temp_file2.md
  fi
  mv temp_file2.md "$TARGET"
fi
rm temp_version_control.md

# 6. 添加文档版本信息
log "添加文档版本信息..."
TODAY=$(date +%Y-%m-%d)
# 创建临时文件，避免使用sed的复杂替换
echo "# 开发流程指南

> 版本兼容性：本文档必须与[guideline.md](../guideline.md) v1.1+ 保持同步  
> 最后同步时间：$TODAY

$(tail -n +2 "$TARGET")" > temp_header.md
mv temp_header.md "$TARGET"

log "✅ 同步完成，所有建议已成功应用"