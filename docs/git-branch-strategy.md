# Git 分支管理策略

本文档定义了项目的 Git 分支管理策略，确保团队成员在开发过程中遵循一致的版本控制流程，提高协作效率和代码质量。

## 1. 分支结构

项目采用以下分支结构：

```
项目分支结构：
├── main                    # 生产环境分支，稳定版本
├── develop                 # 开发环境主分支
├── feature/               # 功能分支目录
│   ├── feature/auth        # 认证功能分支
│   └── feature/payment     # 支付功能分支
├── release/               # 发布分支目录
│   └── release/v1.0.0      # 特定版本发布分支
├── hotfix/                # 紧急修复分支目录
│   └── hotfix/auth-bug     # 认证模块紧急修复
└── i18n/                  # 国际化分支目录
    └── i18n/zh-support     # 中文支持分支
```

## 2. 分支命名规范

### 2.1 功能分支

功能分支用于开发新功能，从 `develop` 分支创建，完成后合并回 `develop`。

```
feature/<功能模块>-<简短描述>
```

示例：
- `feature/auth-social-login`
- `feature/payment-stripe-integration`
- `feature/ui-dark-mode`

### 2.2 修复分支

修复分支用于修复非紧急 bug，从 `develop` 分支创建，完成后合并回 `develop`。

```
fix/<问题编号>-<简短描述>
```

示例：
- `fix/issue-42-header-alignment`
- `fix/issue-57-form-validation`

### 2.3 发布分支

发布分支用于准备新版本发布，从 `develop` 分支创建，完成后同时合并到 `main` 和 `develop`。

```
release/v<主版本>.<次版本>.<修订版本>
```

示例：
- `release/v1.2.0`
- `release/v2.0.0`

### 2.4 热修复分支

热修复分支用于修复生产环境中的紧急问题，从 `main` 分支创建，完成后同时合并到 `main` 和 `develop`。

```
hotfix/v<版本>-<简短描述>
```

示例：
- `hotfix/v1.1.1-login-crash`
- `hotfix/v1.0.2-security-vulnerability`

### 2.5 国际化分支

国际化分支用于添加或更新特定语言的翻译，从 `develop` 分支创建，完成后合并回 `develop`。

```
i18n/<语言代码>-<功能描述>
```

示例：
- `i18n/fr-user-profile`
- `i18n/zh-payment-page`

## 3. 分支工作流程

### 3.1 功能开发工作流

1. **创建功能分支**
   如果当前目录不是git repo，则需要先初始化git repo
   ```bash
   git init
   git add .
   git commit -m "初始化git repo"   
   
   ```
   步骤 2: 创建主要分支
   ```bash
   git checkout -b main
   git push -u origin main
   ```
   步骤 3: 创建开发分支
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```
   步骤 4: 添加远程地址
   ```bash
   git remote add origin <远程地址>
   ```
   然后创建功能分支
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/auth-social-login
   ```

2. **定期同步 develop 分支的更新**
   ```bash
   git checkout develop
   git pull
   git checkout feature/auth-social-login
   git merge develop
   # 解决冲突（如有）
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "feat(auth): 添加社交媒体登录功能"
   ```

4. **完成功能开发**
   ```bash
   git push origin feature/auth-social-login
   # 创建 Pull Request 到 develop 分支
   ```

### 3.2 发布工作流

1. **创建发布分支**
   ```bash
   git checkout develop
   git pull
   git checkout -b release/v1.2.0
   ```

2. **版本号更新和最终调整**
   ```bash
   # 更新版本号和文档
   git add .
   git commit -m "chore(release): 准备 v1.2.0 发布"
   ```

3. **完成发布**
   ```bash
   git push origin release/v1.2.0
   # 创建 Pull Request 到 main 分支
   # 合并到 main 后，再合并回 develop
   ```

4. **标记版本**
   ```bash
   git checkout main
   git pull
   git tag -a v1.2.0 -m "Version 1.2.0"
   git push origin v1.2.0
   ```

### 3.3 热修复工作流

1. **创建热修复分支**
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/v1.1.1-login-crash
   ```

2. **修复问题**
   ```bash
   # 修复代码
   git add .
   git commit -m "fix(auth): 修复登录崩溃问题"
   ```

3. **完成热修复**
   ```bash
   git push origin hotfix/v1.1.1-login-crash
   # 创建 Pull Request 到 main 分支
   # 合并到 main 后，再合并回 develop
   ```

4. **标记修复版本**
   ```bash
   git checkout main
   git pull
   git tag -a v1.1.1 -m "Version 1.1.1"
   git push origin v1.1.1
   ```

## 4. 提交信息规范

所有提交信息应遵循以下格式：

```
<类型>(<作用域>): <描述>

[可选的正文]

[可选的脚注]
```

### 4.1 类型

- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码风格调整（不影响代码功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统或外部依赖变更
- `ci`: CI配置变更
- `chore`: 其他变更
- `i18n`: 国际化相关

### 4.2 作用域

作用域指定更改影响的模块或功能区域，例如：

- `auth`
- `ui`
- `api`
- `db`
- `mobile`

### 4.3 示例

```
feat(auth): 添加社交媒体登录功能

实现了Google和Facebook OAuth登录
支持用户头像和基本信息同步

Closes #123
```

```
fix(ui): 修复移动端导航栏溢出问题

在小屏幕设备上导航栏项目会溢出屏幕，
现在改为在小屏幕上显示汉堡菜单。

Fixes #456
```

## 5. Pull Request 流程

### 5.1 创建 Pull Request

1. 在 GitHub/GitLab 上创建 Pull Request
2. 使用提供的 PR 模板填写必要信息
3. 指定适当的审阅者
4. 关联相关 Issue

### 5.2 PR 模板

```markdown
## 变更描述

[描述此PR的目的和变更内容]

## 相关问题

[关联的Issue编号，例如 #123]

## 变更类型

- [ ] 新功能 (feature)
- [ ] Bug修复 (bugfix)
- [ ] 性能优化 (performance)
- [ ] 代码重构 (refactor)
- [ ] 样式调整 (style)
- [ ] 测试 (test)
- [ ] 文档 (documentation)
- [ ] 构建或CI (build/ci)
- [ ] 其他

## 自测清单

- [ ] 我已在本地测试了这些变更
- [ ] 我已添加必要的测试用例
- [ ] 我已更新相关文档

## 截图（如适用）

[添加相关截图]

## 其他信息

[任何其他相关信息]
```

### 5.3 代码审查标准

#### 功能性审查
- 代码是否实现了预期功能？
- 是否处理了边缘情况和错误情况？
- 是否有适当的错误处理和用户反馈？
- 功能是否在所有目标平台（Web、iOS、Android）上正常工作？

#### 代码质量审查
- 代码是否遵循项目的编码规范？
- 是否有重复代码可以提取为共享函数？
- 变量和函数命名是否清晰且一致？
- 是否有不必要的复杂性？

#### 性能审查
- 代码是否有明显的性能问题？
- 是否有不必要的重渲染或计算？
- 数据获取和状态管理是否高效？

#### 安全审查
- 是否有潜在的安全漏洞？
- 用户输入是否得到适当验证和清理？
- 敏感数据是否得到适当保护？

#### 国际化审查
- 所有用户可见的文本是否已国际化？
- 日期、数字和货币格式是否考虑了本地化？
- UI布局是否适应不同语言的文本长度？

## 6. 分支保护规则

### 6.1 主要分支保护

- `main` 和 `develop` 分支应启用分支保护
- 禁止直接推送到这些分支
- 所有更改必须通过 Pull Request 进行
- Pull Request 必须至少有一个审阅者批准
- 必须通过所有自动化测试

### 6.2 发布分支保护

- `release/*` 分支应启用临时分支保护
- 只有指定的发布管理员可以合并到这些分支
- 合并到 `main` 必须经过严格的测试和审查

## 7. 冲突解决策略

### 7.1 预防冲突

- 保持功能分支生命周期短
- 定期将 `develop` 分支合并到功能分支
- 避免多个开发者同时修改同一文件的同一部分

### 7.2 解决冲突

1. 将最新的目标分支合并到你的分支
   ```bash
   git checkout develop
   git pull
   git checkout feature/your-feature
   git merge develop
   ```

2. 解决冲突
   - 使用 VS Code 或其他工具查看冲突
   - 与相关开发者讨论冲突解决方案
   - 确保解决方案不会破坏任何功能

3. 完成合并
   ```bash
   git add .
   git commit -m "merge: 解决与develop分支的冲突"
   ```

## 8. 版本管理

### 8.1 版本号规范

项目使用语义化版本号 (SemVer)：`主版本.次版本.修订版本`

- **主版本**：不兼容的API变更
- **次版本**：向后兼容的功能新增
- **修订版本**：向后兼容的问题修复

### 8.2 版本标记

每个正式发布版本都应使用Git标签标记：

```bash
git tag -a v1.2.0 -m "Version 1.2.0"
git push origin v1.2.0
```

### 8.3 变更日志

每个版本发布应更新CHANGELOG.md文件，记录：

- 新功能
- 修复的问题
- 重大变更
- 依赖更新

## 9. 特殊情况处理

### 9.1 紧急生产问题

1. 立即创建热修复分支
2. 修复问题并进行充分测试
3. 创建PR并请求紧急审查
4. 合并到`main`并部署
5. 确保将修复也合并到`develop`

### 9.2 长期功能开发

对于开发周期超过两周的大型功能：

1. 将功能拆分为多个子功能分支
2. 定期将完成的子功能合并到主功能分支
3. 定期将`develop`合并到功能分支
4. 考虑使用功能标志控制功能可见性

## 10. 工具与集成

### 10.1 推荐工具

- **Git GUI客户端**：GitKraken, SourceTree, GitHub Desktop
- **VS Code扩展**：GitLens, Git History
- **提交辅助工具**：Commitizen, commitlint

### 10.2 CI/CD集成

- 配置CI以在每个PR上运行测试
- 配置CD以在合并到`main`后自动部署
- 使用环境分支映射（`main` -> 生产，`develop` -> 测试）

## 11. 培训与支持

### 11.1 新团队成员入职

1. 提供Git工作流培训
2. 指派导师进行第一次PR审查
3. 从小型任务开始，熟悉工作流程

### 11.2 常见问题解决

维护常见Git问题的解决方案文档，包括：

- 如何撤销提交
- 如何处理复杂合并冲突
- 如何进行交互式rebase
- 如何处理分支管理错误