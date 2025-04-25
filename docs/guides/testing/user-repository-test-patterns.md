# UserRepository 跨数据库自动化测试用例模式

本规范总结了 `testing/user-repository-indexeddb.impl.test.ts`、`testing/user-repository-sqlite-drizzle.impl.test.ts` 以及推荐的 `user-repository-sqlite-kysely.test.ts` 等典型测试用例结构，为后续扩展更多表结构、数据库类型和 ORM 实现的测试用例编写提供模板。

---

## 1. 推荐测试用例结构（极简模板，适用于 Kysely/SQLite 等）

- **每个测试用例文件独立、无全局依赖**。
- **每次 beforeEach**：直接新建数据库 client 和 repository，清理测试文件，保证隔离。
- **mock 数据唯一性**：所有唯一索引字段（如 id、email、phone、googleId）都需唯一，避免冲突。
- **用例覆盖**：CRUD、findByEmail、findByPhone、findAll 等典型接口。

### 推荐模板示例

```typescript
import { describe, it, beforeEach, expect } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import KyselySQLiteClient from '@/core/lib/db/clients/sqlite/kysely-sqlite-client';
import fs from 'fs';

let dbClient: KyselySQLiteClient<User>;
let repo: UserRepository;
const dbFile = `test_kysely_${Date.now()}.sqlite`;

beforeEach(async () => {
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch {}
  dbClient = new KyselySQLiteClient<User>(dbFile, [userSchema]);
  await dbClient.initialize();
  repo = new UserRepository(dbClient);
});

describe('UserRepository (KyselySQLiteClient)', () => {
  it('should create and find user by id', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'u1@kysely.com', phone: 'p1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  // ...其它用例同理
});
```

---

## 2. IndexedDB/Drizzle ORM 等实现的通用结构

- IndexedDB 可用 fake-indexeddb/auto，Drizzle ORM 需自动 migration。
- 结构可参考本仓库早期用例，但推荐优先采用极简模板，后续易于迁移和维护。

---

## 3. 扩展建议

- **支持更多表结构**：只需传入对应 schema、补全唯一字段 mock 数据。
- **支持更多数据库/ORM**：参考上述结构，封装初始化/清理逻辑。
- **保证测试隔离**：每次用例前彻底清理环境，避免脏数据和连接泄漏。

---

> 本文档为后续所有仓储、数据库类型、ORM 实现的测试用例编写提供标准模板，可直接复制扩展。优先采用简洁、隔离、易维护的结构。
