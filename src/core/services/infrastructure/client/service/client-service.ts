// client/service/client-service.ts
import type { IClientAdapter } from '../types/client-adapter';

/**
 * 客户端服务接口
 * 继承自IClientAdapter，可以添加更多高级方法
 */
export interface ClientService extends IClientAdapter {
  // 可以在这里添加更多高级方法，这些方法可以基于基础适配器方法实现
  // 例如：缓存管理、批量操作等
}