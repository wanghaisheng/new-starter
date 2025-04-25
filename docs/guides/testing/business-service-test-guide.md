# 业务服务测试用例编写指南

本指南介绍如何为业务服务（如 UserService 等）编写高质量的自动化测试用例，确保核心业务逻辑的正确性和可维护性。

## 1. 测试类型

- **单元测试**：通过 mock 仓储/依赖，仅验证 service 层业务分支和异常处理。
- **集成测试**：结合真实数据库/数据服务环境，验证 service 与 repository、数据层的协作，确保全链路可用。

## 2. 典型测试结构

以 `UserService` 为例，推荐如下结构：

```ts
import { describe, it, beforeEach, expect, afterAll, beforeAll } from 'vitest';
import { UserService } from '@/core/services/business/user/service/user-service';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { DrizzleSchemaAdapter } from '@/core/lib/db/schema/adapters/drizzle-adapter';
import type { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import DrizzleSQLiteClient from '@/core/lib/db/clients/sqlite/drizzle-sqlite-client';
import fs from 'fs';

let service: UserService;
let dbFile: string;
let migrationSQL: string[];

beforeAll(async () => {
  // 注册 schema、生成 migrationSQL、初始化数据库
  schemaRegistry.register(userSchema as any);
  const schemas = schemaRegistry.getAllSchemas();
  const drizzleSchema = {};
  for (const schema of schemas) {
    drizzleSchema[schema.name] = DrizzleSchemaAdapter.convertToSqliteTable(schema);
  }
  migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);
  dbFile = `test_user_service_${Date.now()}.sqlite`;
  const dbClient = new DrizzleSQLiteClient<User>(dbFile, drizzleSchema, schemas);
  for (const sql of migrationSQL) {
    dbClient['db'].prepare(sql).run();
  }
  await dbClient.initialize();
  DataServiceRegistry.register('default', dbClient as any);
});

afterAll(() => {
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) {}
  DataServiceRegistry.unregister('default');
  schemaRegistry.clear && schemaRegistry.clear();
});

beforeEach(async () => {
  // 每个用例前重置数据库
  const dataService = DataServiceRegistry.get('default');
  if (dataService && dataService.client && dataService.client['db']) {
    for (const sql of migrationSQL) {
      dataService.client['db'].prepare(sql).run();
    }
    await dataService.client.initialize?.();
  }
  service = new UserService();
});

```

## 3. 推荐用例覆盖点

- 用户创建、查找、更新、删除（含异常分支）
- 通过邮箱/手机号查找
- 批量操作（如 getUsers、getUsersByIds）
- 关键异常分支（如 update/delete 不存在用户）

示例：

```ts
it('should create and find user by id', async () => {
  const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'unique1@test.com', phone: 'unique1' };
  await service.createUser(user);
  const found = await service.getUserById('u1');
  expect(found).toBeTruthy();
  expect(found!.id).toBe('u1');
});

it('should throw if updateUserProfile not found', async () => {
  await expect(service.updateUserProfile('not-exist', { name: 'x' }))
    .rejects.toThrow('Update failed: users id=not-exist not found');
});
```

## 4. 其它建议

- 集成测试建议使用真实 sqlite/mock 数据库，避免污染生产数据。
- 单元测试可通过 mock repository，专注业务分支和异常。
- 测试用例应覆盖所有主流程和关键异常分支。
- 保持测试隔离，每个用例独立初始化和清理数据。

---

如需更多业务服务测试模板或最佳实践，详见 `testing/user-service.test.ts`、`testing/user-repository-sqlite-drizzle.impl.test.ts` 示例。
