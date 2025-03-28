#!/bin/bash

# 移动端路由修复脚本
# 该脚本修复移动端路由结构，确保符合项目规范

# 输出文件
RESULTS_FILE="docs/tasks/mobile-routes-fix-results.txt"

# 清空或创建结果文件
echo "移动端路由修复结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查并创建移动端目录结构
echo "检查移动端目录结构..." >> $RESULTS_FILE

# 确保移动端目录存在
if [ ! -d "app/mobile" ]; then
  mkdir -p app/mobile
  echo "✅ 已创建app/mobile目录" >> $RESULTS_FILE
else
  echo "✓ app/mobile目录已存在" >> $RESULTS_FILE
fi

# 确保移动端标签页目录存在
if [ ! -d "app/mobile/tabs" ]; then
  mkdir -p app/mobile/tabs
  echo "✅ 已创建app/mobile/tabs目录" >> $RESULTS_FILE
else
  echo "✓ app/mobile/tabs目录已存在" >> $RESULTS_FILE
fi

# 确保移动端标签页子页面目录存在
for tab in home profile settings; do
  if [ ! -d "app/mobile/tabs/$tab" ]; then
    mkdir -p "app/mobile/tabs/$tab"
    echo "✅ 已创建app/mobile/tabs/$tab目录" >> $RESULTS_FILE
  else
    echo "✓ app/mobile/tabs/$tab目录已存在" >> $RESULTS_FILE
  fi
done

# 移动文件
echo "移动文件..." >> $RESULTS_FILE

# 移动标签页布局文件
if [ -f "app/(mobile)/tabs/layout.tsx" ]; then
  cp "app/(mobile)/tabs/layout.tsx" "app/mobile/tabs/layout.tsx"
  echo "✅ 已复制标签页布局文件到新位置" >> $RESULTS_FILE
else
  echo "❌ 标签页布局文件不存在" >> $RESULTS_FILE
fi

# 移动标签页重定向文件
if [ -f "app/(mobile)/tabs/page.tsx" ]; then
  cp "app/(mobile)/tabs/page.tsx" "app/mobile/tabs/page.tsx"
  echo "✅ 已复制标签页重定向文件到新位置" >> $RESULTS_FILE
else
  echo "❌ 标签页重定向文件不存在" >> $RESULTS_FILE
fi

# 移动标签页子页面文件
for tab in home profile settings; do
  if [ -f "app/(mobile)/tabs/$tab/page.tsx" ]; then
    cp "app/(mobile)/tabs/$tab/page.tsx" "app/mobile/tabs/$tab/page.tsx"
    echo "✅ 已复制$tab标签页文件到新位置" >> $RESULTS_FILE
  else
    echo "❌ $tab标签页文件不存在" >> $RESULTS_FILE
  fi
done

# 更新主页链接
echo "更新主页链接..." >> $RESULTS_FILE

if [ -f "app/page.tsx" ]; then
  # 备份原文件
  cp app/page.tsx app/page.tsx.bak
  echo "✅ 已备份原始主页文件" >> $RESULTS_FILE
  
  # 更新文件内容
  sed -i 's|href="/tabs"|href="/mobile/tabs"|g' app/page.tsx
  echo "✅ 已更新主页链接" >> $RESULTS_FILE
else
  echo "❌ 主页文件不存在" >> $RESULTS_FILE
fi

# 更新标签页布局文件中的链接
echo "更新标签页布局文件中的链接..." >> $RESULTS_FILE

if [ -f "app/mobile/tabs/layout.tsx" ]; then
  # 备份原文件
  cp app/mobile/tabs/layout.tsx app/mobile/tabs/layout.tsx.bak
  echo "✅ 已备份原始标签页布局文件" >> $RESULTS_FILE
  
  # 更新文件内容
  sed -i 's|href="/tabs/home"|href="/mobile/tabs/home"|g' app/mobile/tabs/layout.tsx
  sed -i 's|href="/tabs/profile"|href="/mobile/tabs/profile"|g' app/mobile/tabs/layout.tsx
  sed -i 's|href="/tabs/settings"|href="/mobile/tabs/settings"|g' app/mobile/tabs/layout.tsx
  sed -i 's|pathname.includes("/tabs/home")|pathname.includes("/mobile/tabs/home")|g' app/mobile/tabs/layout.tsx
  sed -i 's|pathname.includes("/tabs/profile")|pathname.includes("/mobile/tabs/profile")|g' app/mobile/tabs/layout.tsx
  sed -i 's|pathname.includes("/tabs/settings")|pathname.includes("/mobile/tabs/settings")|g' app/mobile/tabs/layout.tsx
  echo "✅ 已更新标签页布局文件中的链接" >> $RESULTS_FILE
else
  echo "❌ 标签页布局文件不存在" >> $RESULTS_FILE
fi

# 更新标签页重定向文件
echo "更新标签页重定向文件..." >> $RESULTS_FILE

if [ -f "app/mobile/tabs/page.tsx" ]; then
  # 备份原文件
  cp app/mobile/tabs/page.tsx app/mobile/tabs/page.tsx.bak
  echo "✅ 已备份原始标签页重定向文件" >> $RESULTS_FILE
  
  # 更新文件内容
  sed -i 's|redirect("/tabs/home")|redirect("/mobile/tabs/home")|g' app/mobile/tabs/page.tsx
  echo "✅ 已更新标签页重定向文件" >> $RESULTS_FILE
else
  echo "❌ 标签页重定向文件不存在" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE
echo "移动端路由修复完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "下一步：" >> $RESULTS_FILE
echo "1. 运行 'bun run dev' 启动开发服务器" >> $RESULTS_FILE
echo "2. 在浏览器中访问 http://localhost:3000" >> $RESULTS_FILE
echo "3. 点击"移动版"链接，检查是否能正确跳转到移动端页面" >> $RESULTS_FILE

# 输出到控制台
echo "✅ 移动端路由修复完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "下一步："
echo "1. 运行 'bun run dev' 启动开发服务器"
echo "2. 在浏览器中访问 http://localhost:3000"
echo "3. 点击"移动版"链接，检查是否能正确跳转到移动端页面" 