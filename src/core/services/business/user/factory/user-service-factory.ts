import { MockUserAdapter } from '@/core/services/business/user/adapters/mock-user-adapter';
import { RemoteUserAdapter } from '@/core/services/business/user/adapters/remote-user-adapter';
import { HybridUserAdapter } from '@/core/services/business/user/adapters/hybrid-user-adapter';
import type { IUserService } from '@/core/services/business/user/types/user-service';
import { UserService } from '@/core/services/business/user/service/user-service';

export type UserServiceType = 'mock' | 'remote' | 'hybrid';
export type UserServiceOptions = {
  apiBaseUrl?: string;
  [key: string]: any;
};

export class UserServiceFactory {
  static createService({
    type = 'hybrid',
    options = {}
  }: {
    type?: UserServiceType,
    options?: UserServiceOptions
  } = {}): IUserService {
    // 统一通过 type/options 创建 UserService，内部自动注入 adapter
    return new UserService(type, options);
  }

  // 新增：自动适配器获取（供统一注册表/工厂调用）
  static getAdapter(type: UserServiceType = 'hybrid', options: UserServiceOptions = {}): any {
    switch (type) {
      case 'mock':
        return new MockUserAdapter();
      case 'remote':
        return new RemoteUserAdapter(options.apiBaseUrl || '');
      default:
        return new HybridUserAdapter(options.apiBaseUrl || '');
    }
  }
}
