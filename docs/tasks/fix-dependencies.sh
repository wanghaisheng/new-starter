#!/bin/bash

# 依赖修复脚本
# 该脚本用于修复依赖安装过程中的常见问题

# 输出文件
RESULTS_FILE="docs/tasks/fix-dependencies-results.txt"

# 清空或创建结果文件
echo "依赖修复结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查磁盘空间
echo "检查磁盘空间..." >> $RESULTS_FILE
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "可用磁盘空间: $DISK_SPACE" >> $RESULTS_FILE

# 清理bun缓存
echo "清理bun缓存..." >> $RESULTS_FILE
bun cache rm
echo "✅ bun缓存已清理" >> $RESULTS_FILE

# 删除node_modules目录
echo "删除node_modules目录..." >> $RESULTS_FILE
if [ -d "node_modules" ]; then
  rm -rf node_modules
  echo "✅ node_modules目录已删除" >> $RESULTS_FILE
else
  echo "⚠️ node_modules目录不存在，跳过删除" >> $RESULTS_FILE
fi

# 重新安装依赖
echo "重新安装依赖..." >> $RESULTS_FILE
echo "这可能需要几分钟时间，请耐心等待..." >> $RESULTS_FILE
bun install

if [ $? -eq 0 ]; then
  echo "✅ 依赖重新安装成功" >> $RESULTS_FILE
else
  echo "❌ 依赖重新安装失败" >> $RESULTS_FILE
  
  # 尝试使用npm安装
  echo "尝试使用npm安装..." >> $RESULTS_FILE
  npm install
  
  if [ $? -eq 0 ]; then
    echo "✅ 使用npm安装依赖成功" >> $RESULTS_FILE
  else
    echo "❌ 使用npm安装依赖失败" >> $RESULTS_FILE
    echo "请检查磁盘空间和网络连接，然后重试" >> $RESULTS_FILE
  fi
fi

# 检查Capacitor依赖
echo "检查Capacitor依赖..." >> $RESULTS_FILE
if [ -d "node_modules/@capacitor" ]; then
  echo "✅ Capacitor依赖已安装" >> $RESULTS_FILE
else
  echo "❌ Capacitor依赖未安装，尝试单独安装..." >> $RESULTS_FILE
  bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
  
  if [ $? -eq 0 ]; then
    echo "✅ Capacitor依赖安装成功" >> $RESULTS_FILE
  else
    echo "❌ Capacitor依赖安装失败" >> $RESULTS_FILE
    echo "请检查磁盘空间和网络连接，然后重试" >> $RESULTS_FILE
  fi
fi

# 创建最小化的.env.local文件（如果不存在）
if [ ! -f ".env.local" ]; then
  echo "创建.env.local文件..." >> $RESULTS_FILE
  echo "NEXT_PUBLIC_ENV_INITIALIZED=true" > .env.local
  echo "✅ .env.local文件创建成功" >> $RESULTS_FILE
else
  # 检查是否已包含初始化标记
  if grep -q "NEXT_PUBLIC_ENV_INITIALIZED=" ".env.local"; then
    # 更新初始化标记
    sed -i 's/NEXT_PUBLIC_ENV_INITIALIZED=.*/NEXT_PUBLIC_ENV_INITIALIZED=true/' .env.local
    echo "✅ .env.local文件中的初始化标记已更新" >> $RESULTS_FILE
  else
    # 添加初始化标记
    echo "NEXT_PUBLIC_ENV_INITIALIZED=true" >> .env.local
    echo "✅ 初始化标记已添加到.env.local文件" >> $RESULTS_FILE
  fi
fi

echo "" >> $RESULTS_FILE
echo "依赖修复完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "如果问题仍然存在，请尝试以下解决方案：" >> $RESULTS_FILE
echo "1. 确保有足够的磁盘空间（至少1GB）" >> $RESULTS_FILE
echo "2. 检查网络连接" >> $RESULTS_FILE
echo "3. 使用管理员权限运行脚本" >> $RESULTS_FILE
echo "4. 尝试使用npm而不是bun安装依赖" >> $RESULTS_FILE
echo "5. 手动安装关键依赖：npm install next react react-dom @capacitor/core" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 依赖修复尝试完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "如果问题仍然存在，您可以尝试以下操作："
echo "1. 确保有足够的磁盘空间（至少1GB）"
echo "2. 检查网络连接"
echo "3. 使用管理员权限运行脚本"
echo "4. 尝试使用npm而不是bun安装依赖"
echo "5. 手动安装关键依赖：npm install next react react-dom @capacitor/core" 