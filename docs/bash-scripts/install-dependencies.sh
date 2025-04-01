#!/bin/bash

# 依赖安装脚本
# 该脚本安装项目所需的依赖

# 输出文件
RESULTS_FILE="docs/tasks/dependencies-results.txt"

# 清空或创建结果文件
echo "依赖安装结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Node.js和bun版本
echo "检查Node.js和bun版本..." >> $RESULTS_FILE
NODE_VERSION=$(node -v)
BUN_VERSION=$(bun -v 2>/dev/null || echo "未安装")
echo "Node.js版本: $NODE_VERSION" >> $RESULTS_FILE
echo "bun版本: $BUN_VERSION" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查bun是否已安装
if [ "$BUN_VERSION" = "未安装" ]; then
  echo "❌ bun未安装，正在尝试安装..." >> $RESULTS_FILE
  echo "❌ bun未安装，正在尝试安装..."
  
  # 尝试安装bun
  curl -fsSL https://bun.sh/install | bash
  
  # 重新检查bun版本
  BUN_VERSION=$(bun -v 2>/dev/null || echo "未安装")
  if [ "$BUN_VERSION" = "未安装" ]; then
    echo "❌ bun安装失败，请手动安装: https://bun.sh" >> $RESULTS_FILE
    echo "❌ bun安装失败，请手动安装: https://bun.sh"
    exit 1
  else
    echo "✅ bun安装成功: $BUN_VERSION" >> $RESULTS_FILE
  fi
fi
echo "" >> $RESULTS_FILE

# 检查package.json是否存在
echo "检查package.json是否存在..." >> $RESULTS_FILE
if [ ! -f "package.json" ]; then
  echo "❌ package.json不存在，请先运行init-project.sh脚本" >> $RESULTS_FILE
  echo "❌ package.json不存在，请先运行init-project.sh脚本"
  exit 1
else
  echo "✅ package.json存在" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 安装依赖
echo "安装依赖..." >> $RESULTS_FILE
echo "这可能需要几分钟时间，请耐心等待..." >> $RESULTS_FILE
echo "安装依赖..." 
echo "这可能需要几分钟时间，请耐心等待..." 

# 使用bun安装依赖
bun install 2>&1 | tee -a $RESULTS_FILE

# 检查安装结果
if [ $? -eq 0 ]; then
  echo "✅ 依赖安装成功" >> $RESULTS_FILE
else
  echo "❌ 依赖安装失败，请检查错误信息" >> $RESULTS_FILE
  echo "❌ 依赖安装失败，请检查错误信息"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 安装Capacitor CLI
echo "安装Capacitor CLI..." >> $RESULTS_FILE
bun add -g @capacitor/cli 2>&1 | tee -a $RESULTS_FILE

# 检查Capacitor CLI安装结果
if [ $? -eq 0 ]; then
  echo "✅ Capacitor CLI安装成功" >> $RESULTS_FILE
else
  echo "❌ Capacitor CLI安装失败，请检查错误信息" >> $RESULTS_FILE
  echo "❌ Capacitor CLI安装失败，请检查错误信息"
  exit 1
fi
echo "" >> $RESULTS_FILE

# 创建依赖安装结果
echo "" >> $RESULTS_FILE
echo "依赖安装完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 依赖安装完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bun run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000" 