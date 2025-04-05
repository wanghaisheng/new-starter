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
for file in "tasks/mobile-frontend-data-plan.md" "tasks/mobile-frontend-data-progress.md" "tasks/mobile-frontend-data-tasks.md" "tasks/mobile-frontend-data-tasks-progress.md"; do
  if [ -f "$file" ]; then
    echo "移动 $file 到 tasks/mobile-frontend/"
    mv "$file" tasks/mobile-frontend/
  else
    echo "文件未找到: $file"
  fi
done

# 移动测试相关文件
if [ -f "tasks/mobile-testing-progress.md" ]; then
  echo "移动 tasks/mobile-testing-progress.md 到 tasks/testing/"
  mv "tasks/mobile-testing-progress.md" tasks/testing/
fi

if [ -f "tasks/test-summary.md" ]; then
  echo "移动 tasks/test-summary.md 到 tasks/testing/"
  mv "tasks/test-summary.md" tasks/testing/
fi

# 移动项目进度文件
if [ -f "tasks/project-progress.md" ]; then
  echo "移动 tasks/project-progress.md 到 tasks/project-management/"
  mv "tasks/project-progress.md" tasks/project-management/
fi

# 移动旧的数据库任务到数据库目录（如果存在于old目录）
if [ -d "tasks/old" ]; then
  echo "检查old目录中的数据库任务..."
  for file in "tasks/old/database-implementation-plan.md" "tasks/old/database-implementation-progress.md" "tasks/old/database-test-implementation-plan.md" "tasks/old/database-test-progress.md"; do
    if [ -f "$file" ]; then
      echo "复制 $file 到 tasks/database/"
      cp "$file" tasks/database/
    fi
  done
fi

# 移动旧的应用开发任务到应用开发目录（如果存在于old目录）
if [ -d "tasks/old" ]; then
  echo "检查old目录中的应用开发任务..."
  for file in "tasks/old/dating-app-implementation-plan.md" "tasks/old/dating-app-implementation-progress.md" "tasks/old/dating-app-journey-test.md"; do
    if [ -f "$file" ]; then
      echo "复制 $file 到 tasks/app-development/"
      cp "$file" tasks/app-development/
    fi
  done
fi

# 将db-refactor目录复制到数据库目录
if [ -d "tasks/db-refactor" ]; then
  echo "复制 tasks/db-refactor 目录到 tasks/database/"
  cp -r "tasks/db-refactor" tasks/database/
fi

# 将tinder-app-starter目录复制到应用开发目录
if [ -d "tasks/tinder-app-starter" ]; then
  echo "复制 tasks/tinder-app-starter 目录到 tasks/app-development/"
  cp -r "tasks/tinder-app-starter" tasks/app-development/
fi

# 创建 README.md 文件在每个目录中
echo "# 移动前端开发任务

本目录包含移动前端开发相关的任务计划、进度报告和任务清单。
" > tasks/mobile-frontend/README.md

echo "# 数据库开发任务

本目录包含数据库开发相关的任务计划、进度报告和任务清单。
" > tasks/database/README.md

echo "# 应用开发任务

本目录包含应用开发相关的任务计划、进度报告和任务清单。
" > tasks/app-development/README.md

echo "# 测试任务

本目录包含测试相关的任务计划、进度报告和测试摘要。
" > tasks/testing/README.md

echo "# 项目管理任务

本目录包含项目管理相关的任务计划和项目进度报告。
" > tasks/project-management/README.md

# 更新索引文件
echo "更新 tasks/index.md 文件"
cat > tasks/index.md << 'EOL'
# 项目任务索引

本文档提供了项目中所有任务和进度的索引，帮助开发者快速查找和了解项目进展。

## 移动前端开发
- [移动前端和数据开发计划](./mobile-frontend/mobile-frontend-data-plan.md)
- [移动前端和数据开发进度](./mobile-frontend/mobile-frontend-data-progress.md)
- [移动前端和数据开发任务清单](./mobile-frontend/mobile-frontend-data-tasks.md)
- [移动前端和数据任务进度跟踪](./mobile-frontend/mobile-frontend-data-tasks-progress.md)

## 数据库开发
- [数据库实施计划](./database/database-implementation-plan.md)
- [数据库实施进度](./database/database-implementation-progress.md)
- [数据库测试实施计划](./database/database-test-implementation-plan.md)
- [数据库测试进度](./database/database-test-progress.md)
- [数据库重构计划](./database/db-refactor/README.md)

## 应用开发
- [约会应用实现计划](./app-development/dating-app-implementation-plan.md)
- [约会应用实现进度](./app-development/dating-app-implementation-progress.md)
- [约会应用旅程测试](./app-development/dating-app-journey-test.md)
- [Tinder应用初始计划](./app-development/tinder-app-starter/README.md)

## 测试
- [移动测试进度](./testing/mobile-testing-progress.md)
- [测试摘要](./testing/test-summary.md)

## 项目管理
- [项目总体进度](./project-management/project-progress.md)

## 历史任务记录
旧版任务和历史记录可以在 [old](./old/) 目录中查找。
EOL

echo "更新 tasks/README.md 文件"
cat > tasks/README.md << 'EOL'
# 任务文档管理指南

## 文档索引

请参考 [任务索引文件](./index.md) 获取项目所有任务的完整列表和链接，包括：
- 移动前端开发任务
- 数据库开发任务
- 应用开发任务
- 测试任务
- 项目管理任务

## 文件组织策略

任务文档按照以下结构组织：

```
tasks/
├── README.md                         # 本指南文档
├── index.md                          # 任务索引文件，所有任务的入口
├── mobile-frontend/                  # 移动前端开发任务
│   ├── README.md                     # 移动前端任务说明
│   ├── mobile-frontend-data-plan.md  # 移动前端与数据任务计划
│   └── mobile-frontend-data-progress.md # 移动前端与数据任务进度
├── database/                         # 数据库开发任务
│   ├── README.md                     # 数据库任务说明
│   ├── database-implementation-plan.md # 数据库实施计划
│   └── db-refactor/                  # 数据库重构相关文档
├── app-development/                  # 应用开发任务
│   ├── README.md                     # 应用开发任务说明
│   └── tinder-app-starter/           # Tinder应用初始文档
├── testing/                          # 测试任务
│   ├── README.md                     # 测试任务说明
│   ├── mobile-testing-progress.md    # 移动测试进度
│   └── test-summary.md               # 测试摘要
├── project-management/               # 项目管理任务
│   ├── README.md                     # 项目管理任务说明
│   └── project-progress.md           # 项目总体进度
└── old/                              # 已完成或存档的任务文档
```

## 文件命名规范

为确保任务文档的一致性和可追溯性，我们采用以下命名规范：

### 任务计划文档

格式：`{module}-{task-type}-plan.md`

示例：
- `mobile-frontend-data-plan.md` - 移动端前端与数据模块任务计划
- `database-implementation-plan.md` - 数据库实现任务计划

### 任务进度文档

格式：`{module}-{task-type}-progress.md`

示例：
- `mobile-frontend-data-progress.md` - 移动端前端与数据模块任务进度
- `database-implementation-progress.md` - 数据库实现任务进度

### 已完成或存档的任务文档

已完成或存档的任务文档应移至 `old` 子目录，并可选择添加日期后缀：

格式：`old/{module}-{task-type}-{status}-{YYYY-MM-DD}.md`

示例：
- `old/mobile-frontend-data-completed-2023-04-10.md`
- `old/database-implementation-archived-2023-04-05.md`

## 任务跟踪机制

### 任务状态标记

在任务文档中使用以下标记表示任务状态：

- `[ ]` 或 `⏳` - 待办任务
- `[x]` 或 `✅` - 已完成任务
- `[~]` 或 `🔄` - 进行中任务
- `[!]` 或 `⚠️` - 阻塞或有风险的任务
EOL

echo "完成！任务文件已重新组织到子目录中。" 