# AI 图片任务队列服务（Cloudflare KV 版）

本目录实现了基于 Cloudflare KV 的 AI 图片异步处理任务队列，适用于图片上传后自动分发至 AI Worker 进行处理，处理完成后支持进度查询与结果通知。

---

## 目录结构

```
ai-task/
├── README.md
├── api/
│   └── ai-task-upload.ts           # 上传+入队API
├── queue/
│   └── ai-task-queue-service.ts    # Cloudflare KV 队列服务
├── worker/
│   └── ai-task-worker.ts           # Worker 消费主循环（AI处理）
├── types/
│   └── ai-task.ts                  # 任务类型定义
```

---

## 核心流程说明

### 1. 上传与入队
- 用户上传图片，服务端调用 `ImageService('r2')` 上传图片到 Cloudflare R2。
- 上传成功后生成唯一 taskId，构造 `AiImageTask`。
- 调用 `AiTaskQueueService.enqueueTask` 写入 Cloudflare KV 队列。
- 返回 `{ taskId, imageUrl }` 给前端。

### 2. AI Worker 消费与处理
- Worker 端调用 `popTask()` 轮询获取待处理任务。
- 处理前更新任务状态为 `processing`。
- AI 处理完成后，调用 `updateTaskStatus` 标记为 `done` 并写入结果。
- 失败时标记为 `failed` 并写入错误信息。

### 3. 前端 hooks 与进度订阅
- 提供 `useAiImageTaskQueue` hooks，支持上传、队列入队、任务状态订阅。
- hooks 通过 API 轮询（或 WebSocket/SSE）实时获取任务进度与结果。

---

## 关键接口说明

### AiImageTask 结构
```typescript
export interface AiImageTask {
  taskId: string;
  userId: string;
  imageUrl: string;
  status: 'uploaded' | 'processing' | 'done' | 'failed';
  result?: any;
  error?: any;
  createdAt: string;
}
```

### 队列服务（AiTaskQueueService）
- `enqueueTask(task)`：入队新任务
- `popTask()`：弹出下一个待处理任务
- `updateTaskStatus(taskId, status, result?, error?)`：更新任务状态与结果
- `getTask(taskId)`：查询单个任务详情

### Worker 处理主循环
- 见 `worker/ai-task-worker.ts`，支持自动轮询处理、异常捕获与状态更新

### 上传与入队 API 示例
- 见 `api/ai-task-upload.ts`，适配 Next.js/Express/Koa/Cloudflare Worker

### 前端 hooks
- 见 `useAiImageTaskQueue.ts`，支持上传、队列入队、任务状态实时订阅与UI绑定

---

## 典型调用流程

1. 前端调用 hooks 的 `enqueueAiTask(userId, file)`，自动上传图片并入队。
2. 后端上传API完成后返回 `{taskId, imageUrl}`。
3. 前端 hooks 自动轮询任务状态，处理完成后自动刷新 UI。
4. Worker 持续消费任务队列，AI处理后写入结果。

---

## 扩展建议
- 支持 WebSocket/SSE 实时推送任务进度
- 支持批量上传、任务优先级、失败重试
- 可扩展为多模型/多类型 AI 任务队列
- 支持多端/多用户协作与权限控制

---

如需 API 路由、Worker 入口、WebSocket 推送、批量任务等高级范例，请参考相应源码或联系维护者。
