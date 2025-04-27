# 消息服务（Message）模块说明

## 插件化注册表与工厂函数模式在 Message 业务的具体应用

为适应多消息通道、多品牌、多业务方等复杂消息需求，Message 模块全面采用“注册表+工厂函数”插件化架构：

- **多类型适配**：每种消息类型/通道/品牌（如 mock、remote、hybrid、brandA、brandB、push、im 等）都实现独立的 IMessageAdapter 子类（如 MockMessageServiceAdapter、RemoteMessageServiceAdapter、BrandAMessageServiceAdapter 等）。
- **插件式注册**：所有适配器通过 `MessageServiceFactory.registerAdapter(type, factory)` 注册，支持运行时动态扩展、A/B 测试、品牌定制、灰度发布等。
- **统一实例获取**：业务层、hooks 层、页面组件统一通过 `MessageServiceFactory.createService({ type, options, dataService })` 获取服务实例，严禁直接 new 或手动切换。
- **自动降级与Mock**：支持根据环境、配置自动降级为 mock/remote/brandX/定制类型。
- **扩展示例**：如需新增“企业微信消息”通道，仅需实现 WeComMessageAdapter 并注册即可，无需改动主流程。

### 典型用法示例
```ts
// 注册自定义适配器（如新通道/品牌/业务方）
MessageServiceFactory.registerAdapter('wecom', () => new WeComMessageAdapter());

// 获取指定类型的 MessageService 实例
const messageService = MessageServiceFactory.createService({ type: 'im', dataService });

// 在 hooks 层统一获取
const { messages, loading, error } = useMessages({ type: 'remote' });
```

### 最佳实践
- 所有 message 相关实现、扩展、测试均应通过插件化注册表完成，禁止硬编码类型。
- hooks 层、service 层、页面层调用方式完全解耦，便于维护、扩展和测试。
- 支持多通道、多品牌、多业务方并存，满足复杂消息业务需求。

如需批量注册/扩展新消息类型，请参考 factory/message-service-factory.ts 及本说明。
