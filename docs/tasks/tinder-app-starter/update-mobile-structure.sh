#!/bin/bash

# 移动端结构更新脚本
# 该脚本删除旧的(mobile)文件夹，并更新所有文档中的相关引用

# 输出文件
RESULTS_FILE="docs/tasks/mobile-structure-update-results.txt"

# 清空或创建结果文件
echo "移动端结构更新结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 删除旧的(mobile)文件夹
echo "删除旧的(mobile)文件夹..." >> $RESULTS_FILE

if [ -d "app/(mobile)" ]; then
  rm -rf "app/(mobile)"
  echo "✅ 已删除app/(mobile)文件夹" >> $RESULTS_FILE
else
  echo "✓ app/(mobile)文件夹不存在，无需删除" >> $RESULTS_FILE
fi

# 更新文档中的引用
echo "更新文档中的引用..." >> $RESULTS_FILE

# 查找所有文档文件
DOC_FILES=$(find docs -type f -name "*.md")

# 更新文档中的引用
for file in $DOC_FILES; do
  # 备份原文件
  cp "$file" "$file.bak"
  
  # 替换引用
  sed -i 's|app/(mobile)|app/mobile|g' "$file"
  sed -i 's|(mobile)|mobile|g' "$file"
  
  # 检查是否有更改
  if diff -q "$file" "$file.bak" > /dev/null; then
    echo "✓ 文件 $file 无需更新" >> $RESULTS_FILE
    rm "$file.bak"
  else
    echo "✅ 已更新文件 $file 中的引用" >> $RESULTS_FILE
  fi
done

# 更新.cursorrules.json文件
echo "更新.cursorrules.json文件..." >> $RESULTS_FILE

if [ -f ".cursorrules.json" ]; then
  # 备份原文件
  cp .cursorrules.json .cursorrules.json.bak
  
  # 替换引用
  sed -i 's|app/(mobile)|app/mobile|g' .cursorrules.json
  sed -i 's|(mobile)|mobile|g' .cursorrules.json
  
  # 检查是否有更改
  if diff -q .cursorrules.json .cursorrules.json.bak > /dev/null; then
    echo "✓ .cursorrules.json文件无需更新" >> $RESULTS_FILE
    rm .cursorrules.json.bak
  else
    echo "✅ 已更新.cursorrules.json文件中的引用" >> $RESULTS_FILE
  fi
else
  echo "❌ .cursorrules.json文件不存在" >> $RESULTS_FILE
fi

# 更新其他配置文件
echo "更新其他配置文件..." >> $RESULTS_FILE

# 查找所有配置文件
CONFIG_FILES=$(find . -maxdepth 1 -type f -name "*.json" -o -name "*.js" -o -name "*.ts" | grep -v "node_modules")

# 更新配置文件中的引用
for file in $CONFIG_FILES; do
  # 备份原文件
  cp "$file" "$file.bak"
  
  # 替换引用
  sed -i 's|app/(mobile)|app/mobile|g' "$file"
  sed -i 's|(mobile)|mobile|g' "$file"
  
  # 检查是否有更改
  if diff -q "$file" "$file.bak" > /dev/null; then
    echo "✓ 文件 $file 无需更新" >> $RESULTS_FILE
    rm "$file.bak"
  else
    echo "✅ 已更新文件 $file 中的引用" >> $RESULTS_FILE
  fi
done

echo "" >> $RESULTS_FILE
echo "移动端结构更新完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE
echo "3. 点击"移动版"链接，检查是否能正确跳转到移动端页面" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 移动端结构更新完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bun run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000"
echo "3. 点击"移动版"链接，检查是否能正确跳转到移动端页面" 