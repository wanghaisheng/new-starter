# src/core/hooks 类型与实例管理整改计划

## 一、整改目标
1. **类型定义唯一化**：所有领域类型（如 Message、User、Match 等）统一存放于 `@/core/lib/db/types/*.types.ts`，禁止多处定义和分散引用。
2. **类型引用规范化**：所有 hooks、service、页面组件类型引入均采用 `import type { ... } from '@/core/lib/db/types/xxx.types';`，禁止相对路径和 default export。
3. **服务实例获取一致化**：所有业务 hooks 统一通过 Registry 获取服务实例，禁止 Factory 直连。
4. **返回值与状态输出规范**：所有 hooks 返回值统一包含 loading、error（分类型）、empty 字段，并友好处理异常与提示。
5. **文档与测试同步**：README.md、测试用例同步维护，确保用法、错误处理、边界场景都有覆盖。

## 二、整改任务清单（2025-04-23 进度）

- [x] 1. 检查并合并所有领域类型定义到唯一的 `*.types.ts` 文件，删除冗余类型文件。（已完成，主类型均唯一化）
- [x] 2. 全量替换 src/core/hooks、src/core/services、页面等处的类型 import 路径，统一为 `@/core/lib/db/types/*.types.ts`。（已完成，所有 hooks 及主要页面已修正）
- [x] 3. 检查所有 hooks/service 类型引入是否使用 `import type`，如无则修正。（已完成）
- [x] 4. 检查并修正所有业务 hooks 服务实例获取方式，统一通过 Registry。（已完成，包括 useSetting）
- [x] 5. 检查所有 hooks 返回值结构，确保 loading、error（分类型）、empty 字段齐全且含义一致。（已完成，error 字段已统一结构）
- [x] 6. 检查并完善 hooks/README.md，补充类型引入、异常处理、组合用法等最佳实践。（已完成，典型用法已补充）
- [ ] 7. 检查并完善 hooks 下测试用例，覆盖类型、异常、状态输出等关键场景。（建议后续补充）
- [ ] 8. Mock/测试环境 hooks 自动降级到 mock service，确保测试隔离。（建议后续补充）

## 三、进度追踪与责任人
- 责任人：@项目维护人
- 计划完成时间：建议 1 周内完成
- 进度追踪：每完成一项，及时勾选并记录问题与经验

## 四、补充说明
- 本整改计划与 src/core/hooks/README.md、项目最佳实践文档同步更新。
- 后续新 hooks 必须严格遵循本规范，违例需及时修正。

---

如需自动批量修正或生成详细检查报告，请联系维护人或使用自动化脚本。
