// core/services 统一入口
// 按需导出各业务服务

// 业务服务统一建议通过 hooks + registry/provider 获取
// 如需全局导出，建议只导出 registry/factory，不导出具体 service 实例
// 示例：
export * from './business/user/registry/user-service-registry';
export * from './infrastructure/image/registry/image-service-registry';
export * from './data/factory/data-service-factory';
export * from './infrastructure/network/service/network-service';
export * from './infrastructure/logger';

// 仅底层扩展/测试可直接用 factory，页面/业务 hooks 禁止直接用 factory/service

// 其他服务如需导出，请补充
