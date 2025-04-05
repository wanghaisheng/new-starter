# Shell脚本最佳实践

本文档提供了在项目中使用Git Bash脚本进行批量操作的最佳实践和示例，特别是对于文件移动和项目重组任务。

## 环境推荐

在Windows环境下开发本项目时，我们推荐：

1. **优先使用Git Bash**：在Windows环境中，Git Bash提供了类Unix的命令行环境，更适合执行批量文件操作和项目重组任务。
2. **避免使用PowerShell或CMD**：这些工具对于批量文件操作有诸多限制，尤其是PowerShell的参数处理方式与bash不同。

## 批量文件操作

### 文件移动和重组

当需要移动大量文件或重组项目结构时，应该优先创建bash脚本而不是手动操作或使用PowerShell：

```bash
#!/bin/bash

# 示例：重组任务目录结构
mkdir -p target_dir/category1
mkdir -p target_dir/category2

# 批量移动文件
for file in source_dir/*.md; do
  if grep -q "Category1" "$file"; then
    mv "$file" target_dir/category1/
  elif grep -q "Category2" "$file"; then
    mv "$file" target_dir/category2/
  fi
done
```

### 示例：任务目录重组脚本

以下是一个实际的任务目录重组脚本示例：

```bash
#!/bin/bash

# 任务文件移动脚本
# 用于重组任务目录结构，将相关任务文件移动到对应的任务目录

echo "开始整理任务文件结构..."

# 确保目标目录存在
mkdir -p tasks/mobile-frontend
mkdir -p tasks/database
mkdir -p tasks/app-development
mkdir -p tasks/testing
mkdir -p tasks/project-management

echo "已创建目录结构"

# 移动移动前端相关文件
for file in "tasks/mobile-frontend-data-plan.md" "tasks/mobile-frontend-data-progress.md"; do
  if [ -f "$file" ]; then
    echo "移动 $file 到 tasks/mobile-frontend/"
    mv "$file" tasks/mobile-frontend/
  else
    echo "文件未找到: $file"
  fi
done

# 创建README.md文件
echo "# 移动前端开发任务" > tasks/mobile-frontend/README.md
echo "" >> tasks/mobile-frontend/README.md
echo "本目录包含移动前端开发相关的任务计划、进度报告和任务清单。" >> tasks/mobile-frontend/README.md
```

## 自动化脚本最佳实践

### 1. 脚本设计原则

- **幂等性**：脚本应该可以多次运行而不导致副作用
- **防御性编程**：脚本应检查必要条件并优雅地处理错误
- **反馈与日志**：脚本应提供清晰的执行进度和结果反馈
- **注释完善**：每个脚本应有清晰的注释和用途说明

### 2. 在Cursor中使用Git Bash

在Cursor中进行开发时，推荐将终端配置为使用Git Bash而非PowerShell：

1. 打开Cursor设置 (Ctrl+,)
2. 搜索"terminal"
3. 在"Terminal › Integrated › Default Profile: Windows"设置中选择"Git Bash"

### 3. 文件操作安全措施

批量移动文件时，应采取以下安全措施：

```bash
# 1. 检查文件是否存在
if [ ! -f "$source_file" ]; then
  echo "错误: 源文件不存在: $source_file"
  exit 1
fi

# 2. 检查目标目录是否存在，不存在则创建
if [ ! -d "$target_dir" ]; then
  mkdir -p "$target_dir"
fi

# 3. 检查目标文件是否已存在，避免覆盖
if [ -f "$target_dir/$filename" ]; then
  echo "警告: 目标文件已存在: $target_dir/$filename"
  # 可以添加备份原文件的代码
  cp "$target_dir/$filename" "$target_dir/$filename.bak"
fi
```

### 4. 常用命令示例

```bash
# 搜索并移动匹配的文件
find . -name "*.md" -exec grep -l "关键词" {} \; | xargs -I{} mv {} target_dir/

# 批量替换文件内容
find . -name "*.md" -exec sed -i 's/旧文本/新文本/g' {} \;

# 按类型整理文件
for file in *.{jpg,png,gif}; do
  ext="${file##*.}"
  mkdir -p images/$ext
  mv "$file" images/$ext/
done
```

## 实际案例：文件重组指南

以下是一个更加完整的文件重组任务的执行步骤：

1. **分析当前结构**：
   ```bash
   find tasks -type f -name "*.md" | sort
   ```

2. **创建重组脚本**：
   ```bash
   vim reorganize-files.sh
   # 添加必要的脚本内容
   chmod +x reorganize-files.sh
   ```

3. **先运行测试版本**：
   ```bash
   # 创建测试版本，只输出不执行
   sed 's/mv/echo "Will move:"/g' reorganize-files.sh > test-reorganize.sh
   chmod +x test-reorganize.sh
   ./test-reorganize.sh
   ```

4. **执行并验证**：
   ```bash
   ./reorganize-files.sh
   # 验证结果
   find tasks -type f -name "*.md" | sort
   ```

## 推荐脚本工具

- **rsync**：比mv更强大的文件同步工具
- **find**：灵活的文件查找工具
- **grep/awk/sed**：文本处理三剑客
- **jq**：JSON处理工具

## 结论

使用Git Bash脚本进行批量文件操作不仅可以提高效率，还能保证操作的一致性和可重复性。在本项目中，对于文件移动和项目重组等任务，应优先考虑使用bash脚本而非手动操作或PowerShell命令。 