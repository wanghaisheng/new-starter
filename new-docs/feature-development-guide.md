# 新需求实现与协作规范指南

## 一、需求实现全流程

1. **需求分析与任务拆解**
   - 明确业务目标、涉及模块、数据流
   - 拆解为 schema、service、hook、页面等子任务
   - 在任务系统/Issue/PR 中登记

2. **Schema 新增/变更**
   - 位置：`src/core/schema/`，如有类型同步更新 `src/types/`
   - 需评审，变更后及时同步前后端/测试同学
   - 变更点需在 PR/Issue/文档中明示

3. **服务（Service）开发/修改**
   - 位置：`src/core/services/business/`
   - 遵循接口抽象、分层解耦、单一职责
   - 变更后补充 smoke test/单元测试

4. **Hook 新增/修改**
   - 位置：`src/core/hooks/`
   - 命名规范：useXxx.ts
   - 需补充/完善测试用例（`__tests__` 子目录）
   - 充分 mock 依赖，避免副作用

5. **页面开发**
   - Web：`app/(web)/`，Mobile：`app/mobile/`
   - 页面通过 hooks 调用业务逻辑，不直接操作 service
   - UI 组件建议放 `src/core/components/`、`app/(web)/components/` 或 `app/mobile/components/`

6. **测试与自查**
   - 新增/变更代码需同步补充测试（smoke/unit/integration）
   - 运行 `npx vitest run` 或 `npm run test` 全量测试，CI 必须通过
   - 自查代码风格、注释、类型

7. **文档与交付**
   - 重要变更需同步更新 docs/、new-docs/、tasks/ 等文档
   - 在 test-plan.md 标记新建/变更的测试文件

---

## 二、协作与冲突规避

- 变更 schema/service 时，务必通知相关同学，防止多人同时修改同一数据结构
- 统一使用 @/ 绝对路径
- 代码合并前需通过所有测试和 Code Review
- 重要分支建议提前评审

---

## 三、常见问题与处理建议

- **多人同时改 schema**：先沟通，约定主导人，合并时注意冲突
- **新需求遗漏测试**：开发同步补充，评审时严格检查
- **分支合并冲突**：及时 rebase，保持主干同步
- **文档遗漏**：开发和测试完成后，及时补文档

如有特殊需求或遇到协作障碍，请及时沟通，团队鼓励主动提问和分享！
