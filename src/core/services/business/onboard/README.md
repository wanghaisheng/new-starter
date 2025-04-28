# onboard 服务迁移说明

本目录用于新 onboard 业务服务的实现，遵循与 messages、photo 等服务一致的分层与类型安全规范。

## 目录结构规划
- service/   onboard-service.ts  业务逻辑实现
- types/     onboard-service.ts  类型定义

## 迁移注意事项
- 保持接口与原有 deprecated/onboard/service/onboard-service.ts 一致
- 类型定义参考 src/core/lib/db/types/onboard.types.ts
- 后续可扩展 repository 层实现

## 迁移进度
- [x] 梳理旧服务接口
- [ ] 新目录结构创建
- [ ] 类型定义迁移
- [ ] 服务实现迁移
- [ ] 测试用例补充
- [ ] 文档完善