# 服务、数据库与 API Router（trpc/REST）集成说明

## 1. 当前架构分层说明

- **Service 层**：如 UserService、MessageService、MatchService 等，位于 `src/core/services/business/`，负责业务逻辑聚合和底层适配。
- **数据库层**：模型和仓储（Repository）位于 `src/core/lib/db/models/` 和 `src/core/lib/db/repositories/`，如 UserRepository、MatchActionRepository，负责数据库读写。
- **API Router 层**：API 路由在 `app/api/mobile/v1/`，每个路由文件暴露 RESTful 接口，内部调用 Service 层处理请求。

### 典型调用链
```
API Router (RESTful)
    ↓
Service 层（业务逻辑、聚合、适配器）
    ↓
Repository 层（数据库读写、复杂查询）
    ↓
数据库（本地/远程）
```

## 2. tRPC 现状与集成建议

- 当前项目未集成 tRPC，API 路由采用 Next.js 原生 RESTful 风格。
- 如需集成 tRPC，可在 `/src/server/trpc/` 或 `/src/pages/api/trpc/` 新建 tRPC router，将 Service 层方法通过 tRPC router 暴露，前端直接 typesafe 调用。
- tRPC 集成后，API handler 可通过 `createNextApiHandler` 暴露类型安全 RPC 接口，前后端类型自动同步。

## 3. 代码示例

### RESTful API 路由调用 Service 层
```typescript
// app/api/mobile/v1/messages/route.ts
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const chatService = MessageService.getInstance();
    const userId = req.headers.get('user-id');
    const chats = await chatService.getUserChats(userId);
    return APIResponseBuilder.success(chats);
  });
}
```

### tRPC 集成思路（伪代码）
```typescript
// src/server/trpc/router.ts
import { createTRPCRouter, publicProcedure } from '@trpc/server';
import { MessageService } from '@/core/services/business/message/service/message-service';

export const appRouter = createTRPCRouter({
  getUserChats: publicProcedure.input(z.string()).query(async ({ input: userId }) => {
    return MessageService.getInstance().getUserChats(userId);
  }),
});
```

## 4. 总结
- 当前为 RESTful API + Service + Repository 分层架构，解耦良好。
- tRPC 可平滑迁移，推荐未来逐步引入以提升类型安全和开发效率。

## 5. tRPC 集成完整示例

以下为在本项目架构下集成 tRPC 的详细步骤与代码示例：

### 步骤一：安装依赖
```bash
npm install @trpc/server @trpc/client @trpc/react-query zod
```

### 步骤二：定义 tRPC router
```typescript
// src/server/trpc/router.ts
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { MessageService } from '@/core/services/business/message/service/message-service';

const t = initTRPC.create();

export const appRouter = t.router({
  getUserChats: t.procedure.input(z.string()).query(async ({ input: userId }) => {
    return MessageService.getInstance().getUserChats(userId);
  }),
  sendMessage: t.procedure.input(z.object({ chatId: z.string(), text: z.string() })).mutation(async ({ input }) => {
    return MessageService.getInstance().sendMessage(input.chatId, input.text);
  }),
});

export type AppRouter = typeof appRouter;
```

### 步骤三：API handler 集成（Next.js）
```typescript
// src/pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/trpc/router';

export default createNextApiHandler({
  router: appRouter,
  createContext: () => ({}), // 可根据需要传递上下文
});
```

### 步骤四：前端调用（React 示例）
```typescript
// src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/router';

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// 页面组件中调用
import { trpc } from '@/utils/trpc';

function ChatList() {
  const { data, isLoading, error } = trpc.getUserChats.useQuery('user-id-xxx');
  // ...渲染逻辑
}

function SendMessageButton() {
  const mutation = trpc.sendMessage.useMutation();
  // ...调用 mutation.mutate({ chatId, text })
}
```

### 补充说明
- tRPC router 内部可直接复用现有 Service 层，无需重复业务逻辑。
- 前端通过 trpc client 自动获得类型推导与接口提示。
- 支持 Query、Mutation、Subscription 等多种调用方式。
- 可与 React Query、Next.js App Router 等无缝集成。

如需实际迁移方案或遇到具体集成问题，请补充需求。
