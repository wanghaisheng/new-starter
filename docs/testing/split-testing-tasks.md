# 用户服务与仓储分层测试任务清单

本文件用于指导如何分别对“用户业务服务层（Service）”与“用户仓储层（Repository）”进行单元/集成测试，确保多环境/多数据源切换下系统健壮性。

---

## 一、用户仓储层（Repository）测试任务

### 目标
- 验证仓储注册表（repositoryRegistry）能根据不同环境/配置，自动注册并切换到正确的数据存储实现（Mock、IndexedDB、SQLite、Supabase等）。
- 验证各仓储实现的基本 CRUD 能力和数据一致性。

### 任务清单
1. **环境切换测试**
   - [ ] 在 mock/local/prod 等多种环境下，断言 repositoryRegistry.get('user') 返回的实例类型正确。
   - [ ] 环境变量可通过 process.env.ENV_STAGE 或配置服务注入。
2. **实现覆盖测试**
   - [ ] 分别对 UserMockRepository、UserRepository、UserSupabaseRepository 等实现做基本的 create/read/update/delete 测试。
   - [ ] 验证数据写入、读取、删除等操作在各实现下均无误。
3. **多数据源集成测试**
   - [ ] 在 CI 环境下，自动跑多环境集成测试，确保数据流端到端无误。


## 二、用户业务服务层（Service）测试任务

### 目标
- 验证业务服务层（如 NewUserService）能正确通过仓储接口获取/变更数据，业务逻辑健壮。
- 验证服务层对仓储的 mock 注入、异常处理、状态包装等能力。

### 任务清单
1. **mock 仓储测试**
   - [ ] 所有服务层测试均 mock repositoryRegistry.get('user')，专注业务逻辑。
   - [ ] 覆盖 getCurrentUser、getUserById、updateUserProfile、createUser、getUsers、deleteUser 等主方法。
   - [ ] 断言返回 AsyncState 结构（data、loading、error、empty）。
2. **异常处理测试**
   - [ ] 仓储抛出异常时，服务层能正确包装 error 字段。
   - [ ] loading/empty 状态逻辑正确。
3. **接口一致性测试**
   - [ ] 服务层返回结构与 hooks/页面消费一致。
   

## 三、集成端到端测试建议
- [ ] 在不同环境变量下启动应用，真实写入/读取数据，验证完整数据流。
- [ ] 可用 CI 工具分别跑 mock、本地、远程等多套环境。

---

> **注意：** 建议所有新测试文件、用例与本清单保持同步，便于团队协作和测试覆盖率统计。
