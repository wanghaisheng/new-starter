# 应用发布工作流程

本文档详细说明了从开发完成到应用发布的完整流程，包括Web版本和移动应用(iOS/Android)的发布步骤。

## 1. 发布准备

### 1.1 发布前检查清单

在准备发布之前，确保完成以下检查：

- [ ] 所有计划功能已完成开发
- [ ] 所有已知bug已修复
- [ ] 单元测试和集成测试已通过
- [ ] 性能测试已完成
- [ ] 安全审查已完成
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] 更新日志(CHANGELOG.md)已更新
- [ ] 所有依赖项已更新到最新稳定版本
- [ ] 国际化文本已完成翻译

### 1.2 版本号管理

项目使用语义化版本号(Semantic Versioning)：

```
主版本号.次版本号.修订号[-预发布标识]
```

- **主版本号**：不兼容的API变更
- **次版本号**：向后兼容的功能新增
- **修订号**：向后兼容的问题修复
- **预发布标识**：alpha, beta, rc等

版本号更新在`package.json`和移动应用配置文件中进行。

### 1.3 创建发布分支

从`develop`分支创建发布分支：

```bash
git checkout develop
git pull
git checkout -b release/v1.0.0
```

## 2. Web版本发布流程

### 2.1 构建生产版本

```bash
# 安装依赖
bun install

# 构建生产版本
bun run build:static
```

### 2.2 本地验证

在部署前进行本地验证：

```bash
# 预览生产构建
bun run preview
```

检查以下内容：
- 所有页面是否正常加载
- 所有功能是否正常工作
- 性能是否符合预期
- 控制台是否有错误

### 2.3 部署到测试环境

```bash
# 部署到测试环境
bun run deploy:test
```

### 2.4 测试环境验证

在测试环境中进行以下验证：
- 功能测试
- 兼容性测试（不同浏览器和设备）
- 性能测试
- 安全测试

### 2.5 部署到生产环境

确认测试环境验证通过后，部署到生产环境：

```bash
# 部署到生产环境
bun run deploy:prod
```

### 2.6 生产环境验证

部署完成后，验证生产环境：
- 抽样检查关键功能
- 监控系统错误和性能指标
- 确认分析工具正常工作

## 3. 移动应用发布流程

### 3.1 更新Capacitor配置

更新版本号和应用信息：

```bash
# 编辑capacitor.config.ts文件更新版本号

# 同步更改到原生项目
bun run cap:sync
```

### 3.2 Android应用发布

#### 3.2.1 构建Android应用

```bash
# 构建Web资源
bun run build:static

# 同步到Android项目
bun run cap:sync android

# 打开Android Studio
bun run cap:android
```

#### 3.2.2 在Android Studio中准备发布

1. 选择`Build > Generate Signed Bundle/APK`
2. 选择Android App Bundle (AAB)或APK
3. 配置签名密钥
4. 选择发布构建变体(release)
5. 完成构建

#### 3.2.3 测试发布版本

使用内部测试渠道测试发布版本：
- Firebase App Distribution
- Google Play内部测试轨道

#### 3.2.4 提交到Google Play

1. 登录[Google Play Console](https://play.google.com/console)
2. 选择应用
3. 创建新版本
4. 上传AAB文件
5. 填写发布说明
6. 提交审核

### 3.3 iOS应用发布

#### 3.3.1 构建iOS应用

```bash
# 构建Web资源
bun run build:static

# 同步到iOS项目
bun run cap:sync ios

# 打开Xcode
bun run cap:ios
```

#### 3.3.2 在Xcode中准备发布

1. 选择正确的目标设备(Generic iOS Device)
2. 选择`Product > Archive`
3. 等待归档完成

#### 3.3.3 测试发布版本

使用TestFlight进行内部测试：
1. 在归档窗口中选择`Distribute App`
2. 选择`App Store Connect`
3. 上传到TestFlight
4. 邀请内部测试人员

#### 3.3.4 提交到App Store

1. 在[App Store Connect](https://appstoreconnect.apple.com)创建新版本
2. 上传截图和描述
3. 填写发布说明
4. 设置价格和可用性
5. 提交审核

## 4. 发布后流程

### 4.1 合并发布分支

发布成功后，将发布分支合并回主分支和开发分支：

```bash
# 合并到main分支
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 合并到develop分支
git checkout develop
git merge release/v1.0.0
git push origin develop
```

### 4.2 创建GitHub发布

1. 在GitHub仓库页面，导航到`Releases`
2. 点击`Draft a new release`
3. 选择刚创建的标签
4. 填写发布标题和说明（基于CHANGELOG）
5. 发布

### 4.3 监控与反馈收集

发布后持续监控：
- 应用性能指标
- 崩溃报告
- 用户反馈
- 应用商店评论

### 4.4 热修复流程

如发现严重问题需要紧急修复：

1. 从`main`分支创建热修复分支：
   ```bash
   git checkout main
   git checkout -b hotfix/v1.0.1
   ```

2. 修复问题并提交
3. 更新版本号为`1.0.1`
4. 按照上述发布流程发布新版本
5. 合并回`main`和`develop`分支

## 5. 自动化发布

### 5.1 CI/CD配置

项目使用GitHub Actions进行CI/CD自动化：

- `.github/workflows/web-deploy.yml` - Web版本部署
- `.github/workflows/android-build.yml` - Android应用构建
- `.github/workflows/ios-build.yml` - iOS应用构建

### 5.2 自动化发布触发

- 合并到`main`分支自动部署到生产环境
- 合并到`release/*`分支自动部署到测试环境
- 创建标签`v*`自动构建移动应用并上传到应用商店

## 6. 发布节奏与计划

### 6.1 发布周期

- **主要版本**：每季度一次
- **次要版本**：每月一次
- **补丁版本**：根据需要随时发布

### 6.2 发布计划模板

| 日期 | 里程碑 | 负责人 |
|------|--------|--------|
| D-14 | 功能冻结，创建发布分支 | 技术负责人 |
| D-10 | 完成所有测试 | QA团队 |
| D-7  | 部署到测试环境 | DevOps |
| D-5  | 测试环境验证完成 | QA团队 |
| D-3  | 准备发布说明和营销材料 | 产品经理 |
| D-1  | 最终审查 | 所有团队 |
| D-Day | 发布到生产环境 | DevOps |
| D+1  | 监控与反馈收集 | 支持团队 |

## 7. 常见问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| 应用商店审核被拒 | 仔细阅读拒绝原因，修复问题，重新提交 |
| 生产环境发现严重bug | 评估影响范围，决定是回滚还是热修复 |
| 版本号冲突 | 确保在发布前检查所有配置文件中的版本号一致性 |
| 自动化部署失败 | 检查CI/CD日志，修复配置问题，必要时手动部署 |

## 8. 发布检查脚本

为简化发布前检查，使用以下脚本：

```bash:docs/tasks/prepare-release.sh
#!/bin/bash

# 发布准备脚本
# 该脚本检查发布前的必要条件并准备发布环境

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ 请提供版本号，例如: bash docs/tasks/prepare-release.sh 1.0.0"
  exit 1
fi

echo "🚀 准备发布版本 v$VERSION..."

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作目录不干净，请提交或暂存所有更改"
  exit 1
fi

# 检查是否在develop分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "❌ 当前不在develop分支，请切换到develop分支"
  exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull

# 运行测试
echo "🧪 运行测试..."
bun test

if [ $? -ne 0 ]; then
  echo "❌ 测试失败，请修复测试后再尝试发布"
  exit 1
fi

# 更新版本号
echo "📝 更新版本号..."
bun version $VERSION

# 更新CHANGELOG
echo "📋 请更新CHANGELOG.md文件，然后按Enter继续..."
read

# 创建发布分支
echo "🌿 创建发布分支..."
git checkout -b release/v$VERSION

# 提交更改
git add package.json CHANGELOG.md
git commit -m "chore(release): prepare v$VERSION"

echo "✅ 发布准备完成！"
echo "下一步："
echo "1. 推送发布分支: git push origin release/v$VERSION"
echo "2. 创建Pull Request合并到main分支"
echo "3. 合并后，创建标签: git tag v$VERSION"
```

## 9. 附录：发布清单模板

### Web发布清单

- [ ] 更新版本号
- [ ] 更新CHANGELOG
- [ ] 运行所有测试
- [ ] 构建生产版本
- [ ] 本地验证
- [ ] 部署到测试环境
- [ ] 测试环境验证
- [ ] 部署到生产环境
- [ ] 生产环境验证
- [ ] 合并发布分支
- [ ] 创建标签
- [ ] 创建GitHub发布

### 移动应用发布清单

- [ ] 更新版本号
- [ ] 更新CHANGELOG
- [ ] 运行所有测试
- [ ] 更新应用图标和启动屏幕
- [ ] 更新应用截图
- [ ] 更新应用描述和关键词
- [ ] 构建生产版本
- [ ] 内部测试
- [ ] 提交应用商店审核
- [ ] 监控审核状态
- [ ] 发布应用
- [ ] 合并发布分支
- [ ] 创建标签
- [ ] 创建GitHub发布 