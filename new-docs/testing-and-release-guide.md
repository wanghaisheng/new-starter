# 测试流程与用例规范

## 一、测试流程
- 所有核心 hooks、service、utils、组件、API 必须有对应测试用例文件（如 useUser.test.ts、UserService.test.ts）
- 新建测试文件需在 test-plan.md 记录，评审后勾选“已创建”
- 推进测试前，先全量扫描目标目录，自动检测缺失测试用例并输出清单
- 运行 `npx vitest run` 或 `npm run test` 全量测试，CI 必须通过
- 评审和合并时，需确认所有主流程/核心分支均有测试覆盖

## 二、测试用例书写规范
- 测试文件与被测文件同级 __tests__ 目录
- 命名：xxx.smoke.test.ts / xxx.unit.test.ts / xxx.integration.test.ts
- 测试结构：Arrange-Act-Assert
- 充分 mock 依赖，避免外部副作用
- 错误/边界场景需覆盖，重要分支均需断言
- 推荐使用 Vitest + React Testing Library
- 单元测试、集成测试、smoke test 均需覆盖

## 三、发布流程
1. 代码合并主分支前，需通过所有测试和 Code Review
2. 运行构建命令 `npm run build`，确保无编译错误
3. 移动端需 `npx cap sync` 并真机测试
4. Web 端部署见 README 或 CI/CD 脚本
5. 重要变更需在 docs/ 或 new-docs/ 下补充文档
6. 发布后监控线上日志，及时响应异常

## 四、Capacitor 插件使用与扩展指南

### 已集成插件
- @capacitor/filesystem
- @capacitor/camera
- @capacitor/storage
- @capacitor/device
- @capacitor/geolocation

### 新增插件流程
1. `npm install @capacitor/xxx`
2. `npx cap sync`
3. 在 `capacitor.config.ts` 注册并配置
4. 在 `src/core/services/mobile/` 下封装调用适配层
5. 编写/完善相关测试用例
6. 更新相关文档和 test-plan.md

---

如需详细了解某一测试场景、插件用法或发布细节，请继续提问！
