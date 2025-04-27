# 通知服务（Notification）模块说明

## 插件化注册表与工厂函数模式在 Notification 业务的具体应用

为适应多通知通道、多品牌、多业务方等复杂通知需求，Notification 模块全面采用“注册表+工厂函数”插件化架构：

- **多类型适配**：每种通知类型/通道/品牌（如 mock、remote、hybrid、push、sms、brandA、brandB 等）都实现独立的 INotificationAdapter 子类（如 MockNotificationServiceAdapter、PushNotificationServiceAdapter、SmsNotificationServiceAdapter、BrandANotificationServiceAdapter 等）。
- **插件式注册**：所有适配器通过 `NotificationServiceFactory.registerAdapter(type, factory)` 注册，支持运行时动态扩展、A/B 测试、品牌定制、灰度发布等。
- **统一实例获取**：业务层、hooks 层、页面组件统一通过 `NotificationServiceFactory.createService({ type, options, dataService })` 获取服务实例，严禁直接 new 或手动切换。
- **自动降级与Mock**：支持根据环境、配置自动降级为 mock/push/sms/定制类型。
- **扩展示例**：如需新增“钉钉通知”通道，仅需实现 DingTalkNotificationAdapter 并注册即可，无需改动主流程。

### 典型用法示例
```ts
// 注册自定义适配器（如新通道/品牌/业务方）
NotificationServiceFactory.registerAdapter('dingTalk', () => new DingTalkNotificationAdapter());

// 获取指定类型的 NotificationService 实例
const notificationService = NotificationServiceFactory.createService({ type: 'push', dataService });

// 在 hooks 层统一获取
const { notifications, loading, error } = useNotifications({ type: 'remote' });
```

### 最佳实践
- 所有 notification 相关实现、扩展、测试均应通过插件化注册表完成，禁止硬编码类型。
- hooks 层、service 层、页面层调用方式完全解耦，便于维护、扩展和测试。
- 支持多通道、多品牌、多业务方并存，满足复杂通知业务需求。

如需批量注册/扩展新通知类型，请参考 factory/notification-service-factory.ts 及本说明。
