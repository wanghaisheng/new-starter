# 脚本生成器模板

## 1. 脚本结构模板

```bash
#!/bin/bash

# 脚本名称：{script_name}
# 描述：{script_description}
# 作者：{author}
# 创建日期：{date}

# 输出文件
RESULTS_FILE="docs/tasks/{script_name}-results.txt"

# 清空或创建结果文件
echo "{script_name} 执行结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查前置条件
echo "检查前置条件..." >> $RESULTS_FILE
{preconditions}

# 执行主要任务
echo "执行主要任务..." >> $RESULTS_FILE
{tasks}

# 验证结果
echo "验证执行结果..." >> $RESULTS_FILE
{validations}

# 清理工作
echo "执行清理工作..." >> $RESULTS_FILE
{cleanup}

echo "" >> $RESULTS_FILE
echo "任务执行完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
{next_steps}

# 输出到控制台
echo "✅ 任务执行完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
{next_steps}
```

## 2. 任务类型映射

| 任务类型 | 脚本模板 |
|---------|---------|
| 目录操作 | create-directory.sh |
| 文件操作 | create-file.sh |
| 依赖安装 | install-dependencies.sh |
| 配置更新 | update-config.sh |
| 代码生成 | generate-code.sh |
| 测试运行 | run-tests.sh |
| 构建部署 | build-deploy.sh |

## 3. 脚本生成规则

### 3.1 目录操作
```bash
# 检查目录是否存在
if [ ! -d "{directory_path}" ]; then
  mkdir -p "{directory_path}"
  echo "✅ 已创建{directory_path}目录" >> $RESULTS_FILE
else
  echo "✓ {directory_path}目录已存在" >> $RESULTS_FILE
fi
```

### 3.2 文件操作
```bash
# 检查文件是否存在
if [ ! -f "{file_path}" ]; then
  touch "{file_path}"
  echo "✅ 已创建{file_path}文件" >> $RESULTS_FILE
else
  echo "✓ {file_path}文件已存在" >> $RESULTS_FILE
fi
```

### 3.3 依赖安装
```bash
# 安装依赖
echo "安装依赖..." >> $RESULTS_FILE
bun add {package_name}
if [ $? -eq 0 ]; then
  echo "✅ 已安装{package_name}" >> $RESULTS_FILE
else
  echo "❌ 安装{package_name}失败" >> $RESULTS_FILE
  exit 1
fi
```

### 3.4 配置更新
```bash
# 更新配置文件
if [ -f "{config_file}" ]; then
  # 备份原文件
  cp "{config_file}" "{config_file}.bak"
  echo "✅ 已备份{config_file}" >> $RESULTS_FILE
  
  # 更新配置
  sed -i '{sed_command}' "{config_file}"
  echo "✅ 已更新{config_file}" >> $RESULTS_FILE
else
  echo "❌ {config_file}文件不存在" >> $RESULTS_FILE
fi
```

### 3.5 代码生成
```bash
# 生成代码文件
cat > "{file_path}" << 'EOL'
{code_content}
EOL
echo "✅ 已生成{file_path}" >> $RESULTS_FILE
```

### 3.6 测试运行
```bash
# 运行测试
echo "运行测试..." >> $RESULTS_FILE
bun test {test_path}
if [ $? -eq 0 ]; then
  echo "✅ 测试通过" >> $RESULTS_FILE
else
  echo "❌ 测试失败" >> $RESULTS_FILE
  exit 1
fi
```

### 3.7 构建部署
```bash
# 构建项目
echo "构建项目..." >> $RESULTS_FILE
bun run build
if [ $? -eq 0 ]; then
  echo "✅ 构建成功" >> $RESULTS_FILE
else
  echo "❌ 构建失败" >> $RESULTS_FILE
  exit 1
fi
```

## 4. 结果验证规则

### 4.1 文件检查
```bash
# 检查文件是否存在
check_file_exists() {
  if [ ! -f "$1" ]; then
    echo "❌ 文件 $1 不存在" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 文件 $1 存在" >> $RESULTS_FILE
  return 0
}
```

### 4.2 目录检查
```bash
# 检查目录是否存在
check_directory_exists() {
  if [ ! -d "$1" ]; then
    echo "❌ 目录 $1 不存在" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 目录 $1 存在" >> $RESULTS_FILE
  return 0
}
```

### 4.3 依赖检查
```bash
# 检查依赖是否安装
check_dependency() {
  if ! bun list | grep -q "$1"; then
    echo "❌ 依赖 $1 未安装" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 依赖 $1 已安装" >> $RESULTS_FILE
  return 0
}
```

### 4.4 配置检查
```bash
# 检查配置是否正确
check_config() {
  if ! grep -q "$1" "$2"; then
    echo "❌ 配置 $1 未找到" >> $RESULTS_FILE
    return 1
  fi
  echo "✅ 配置 $1 已更新" >> $RESULTS_FILE
  return 0
}
```

## 5. 使用示例

### 5.1 从任务计划生成脚本
```bash
# 示例任务计划
task_plan="
1. 创建目录结构
   - src/components
   - src/hooks
   - src/utils

2. 安装依赖
   - @ionic/react
   - @capacitor/core

3. 创建基础组件
   - Button.tsx
   - Card.tsx
"

# 生成脚本
generate_script() {
  local task_plan="$1"
  local script_name="$2"
  
  # 创建脚本文件
  cat > "docs/tasks/$script_name.sh" << 'EOL'
#!/bin/bash
# 根据任务计划生成脚本内容
EOL
  
  # 添加执行权限
  chmod +x "docs/tasks/$script_name.sh"
}
```

### 5.2 执行脚本并验证结果
```bash
# 执行脚本
execute_script() {
  local script_path="$1"
  local results_file="$2"
  
  # 执行脚本
  bash "$script_path"
  
  # 检查结果
  if [ -f "$results_file" ]; then
    echo "✅ 脚本执行完成，结果已保存到 $results_file"
  else
    echo "❌ 脚本执行失败，未生成结果文件"
  fi
}
``` 