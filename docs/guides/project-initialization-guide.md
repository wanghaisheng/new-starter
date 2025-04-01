# 项目初始化指南

本文档提供了项目初始化的详细步骤和说明，帮助开发者快速搭建开发环境。

## 目录

1. [环境要求](#环境要求)
2. [初始化步骤](#初始化步骤)
3. [验证初始化](#验证初始化)
4. [常见问题](#常见问题)

## 环境要求

在开始初始化项目之前，请确保您的系统满足以下要求：

- Node.js 18.17.0或更高版本
- bun 9.6.0或更高版本
- Git
- 用于iOS开发：macOS、Xcode
- 用于Android开发：Android Studio
- Python 3.8或更高版本（可选，用于工具脚本）

## 初始化步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 检查环境

首先，运行环境检查脚本，确认您的系统是否满足项目要求：

```bash
bash docs/tasks/tools/check-environment.sh
```

如果脚本报告任何问题，请按照提示修复。

### 3. 初始化项目

运行项目初始化脚本，创建基础项目结构和配置文件：

```bash
bash docs/tasks/tools/init-project.sh
```

这个脚本将创建必要的目录结构、配置文件和基础代码。

### 4. 初始化Git仓库

运行Git仓库初始化脚本，创建必要的分支和钩子：

```bash
bash docs/tasks/tools/init-git-repo.sh
```

这个脚本将初始化Git仓库，创建main和develop分支，并设置提交钩子。

### 5. 安装依赖

运行依赖安装脚本，安装项目所需的依赖：

```bash
bash docs/tasks/tools/install-dependencies.sh
```

这个脚本将安装项目所需的Node.js依赖和Capacitor插件。

### 6. 设置Python环境（可选）

如果您需要使用项目中的工具脚本，请运行Python环境设置脚本：

```bash
bash docs/tasks/tools/setup-python-env.sh
```

这个脚本将创建Python虚拟环境，安装必要的Python依赖。

## 验证初始化

完成上述步骤后，您可以再次运行环境检查脚本，确认项目是否已正确初始化：

```bash
bash docs/tasks/tools/check-environment.sh
```

如果一切正常，您应该看到所有检查项都通过。

## 开始开发

初始化完成后，您可以开始开发：

```bash
# 启动开发服务器
bun run dev

# 构建项目
bun run build:static

# 同步Capacitor
bun run cap:sync

# 打开Android项目
bun run cap:android

# 打开iOS项目
bun run cap:ios
```

## 常见问题

### 初始化脚本失败

如果任何初始化脚本失败，请检查脚本输出的错误信息，并确保您的系统满足环境要求。

### 依赖安装问题

如果依赖安装失败，可能是由于网络问题或依赖冲突。尝试以下解决方案：

1. 检查网络连接
2. 清除bun缓存：`bun cache rm`
3. 删除node_modules目录并重新安装：`rm -rf node_modules && bun install`

### Git钩子问题

如果Git钩子不工作，可能是由于权限问题。尝试以下解决方案：

```bash
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
```

### 强制重新检查环境

如果您想强制重新检查环境，可以使用`--force`参数：

```bash
bash docs/tasks/tools/check-environment.sh --force 