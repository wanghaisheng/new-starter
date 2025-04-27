用户使用麦克风说话录音，可以转换成文本 可以上传到服务器 可以在ui中播放录音

# 智能消息适配器扩展方案

本目录将实现以下三类智能消息适配器，面向多端同步、AI 智能助手、青少年安全等高阶场景。

---

## 服务注册表 getProvider 统一规范

所有 Registry 的 `getProvider` 方法应采用如下统一签名：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB 等服务类型
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```

- 推荐统一调用体验，便于 hooks 泛型化和批量重构。
- 详见[服务架构统一规范](../../../../docs/guides/architecture/services/overview.md)。

---

## 1. 多端同步适配器（MultiDeviceSyncMessageServiceAdapter）

**主要功能：**
- 支持 Web、APP、小程序等多端消息状态实时同步
- 自动同步已读/未读、草稿、撤回、删除等消息状态
- 支持多端推送（WebSocket/SSE/推送服务）
- 断网重连后自动补齐消息历史，保证一致性
- 设备间已读同步、草稿恢复等

**典型场景：**
- 手机和 Web 端同时在线，消息状态自动同步
- 草稿在多端间无缝切换

---

## 2. AI 智能助手适配器（AIMessageAssistantAdapter）

**主要功能：**
- 集成聊天机器人、智能回复、破冰话题等
- 支持情感分析、自动识别对方情绪
- AI 自动插入辅助消息（如安全提醒、约会建议）
- 内容审核、反垃圾、敏感词识别与提示
- 上下文理解，自动生成表情/图片/语音建议

**典型场景：**
- 冷场时自动推送破冰话题
- 检测到敏感内容时自动拦截或提醒

---

## 3. 青少年安全适配器（TeenSafetyMessageServiceAdapter）

**主要功能：**
- 增强内容审核，自动识别拦截不良/涉黄/诈骗消息
- 反骚扰、黑名单、举报机制
- 限制夜间消息收发，自动屏蔽推送
- 检测并提示可疑账号、可疑链接
- 家长监控、消息留痕、合规存证

**典型场景：**
- 夜间自动关闭消息推送，保护未成年人作息
- 一键举报和黑名单，提升平台安全性

---

> 后续将依次实现以上适配器，所有实现均基于 IMessageService 接口，支持与现有适配器灵活组合。