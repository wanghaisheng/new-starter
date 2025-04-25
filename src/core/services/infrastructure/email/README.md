# Email Service 插件化最佳实践

## 能力说明
- 支持多种邮件发送实现：mock、smtp、自定义
- 插件式注册表与工厂，支持动态扩展
- 统一接口 IEmailService，便于业务无感切换

## 推荐用法
```ts
import { EmailFactory } from './factory/email-factory';
const emailService = EmailFactory.createEmailService({ provider: 'smtp' });
await emailService.sendEmail({ to: 'user@demo.com', subject: '测试', text: '内容' });
```

## 环境变量与配置项
- 推荐通过 `EMAIL_PROVIDER` 或 `NEXT_PUBLIC_EMAIL_PROVIDER` 控制邮件适配器选择（如 mock/smtp/custom）
- EmailFactory 会自动按“参数 > 配置服务 > 环境变量 > 默认”优先级推理 provider
- 统一通过配置服务访问：`configService.get('EMAIL_PROVIDER')`

## 扩展说明
- 通过 EmailRegistry.registerAdapter('myProvider', factory) 可动态扩展自定义适配器
- 所有适配器需实现 IEmailService 接口

## 单元测试建议
- 覆盖内置适配器、fallback、registerAdapter、getAvailableProviders 等场景
- 参考 email-registry.test.ts
