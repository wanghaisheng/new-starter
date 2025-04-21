// 用户服务工厂，统一为 class + static createService 方法
import { MockUserAdapter } from '@/core/services/business/user/adapters/mock-user-adapter';
import { RemoteUserAdapter } from '@/core/services/business/user/adapters/remote-user-adapter';
import { HybridUserAdapter } from '@/core/services/business/user/adapters/hybrid-user-adapter';
import type { IUserService } from '@/core/services/business/user/types/user-service';
import { UserService } from '@/core/services/business/user/service/user-service';

export class UserServiceFactory {
  static createService(env: 'mock' | 'remote' | 'hybrid' = 'hybrid', apiBaseUrl: string = ''): IUserService {
    let adapter;
    switch (env) {
      case 'mock':
        adapter = new MockUserAdapter();
        break;
      case 'remote':
        adapter = new RemoteUserAdapter(apiBaseUrl);
        break;
      default:
        adapter = new HybridUserAdapter(apiBaseUrl);
    }
    return new UserService(adapter);
  }
}
