// 业务聚合服务层，聚合认证适配器
// 只依赖 IAuthService 接口，不关心具体实现
// 可聚合多个适配器/服务，实现业务流程编排
// 便于扩展埋点、缓存、权限校验等横切逻辑
import type { IAuthService, AuthResult, AuthUser } from '../types/auth-service';
import { AuthServiceFactory } from '../factory/auth-service-factory';

/**
 * AuthService 业务服务层（可选）
 * - 只依赖 IAuthService 接口，不关心具体实现
 * - 可聚合多个适配器/服务，实现业务流程编排
 * - 便于扩展埋点、缓存、权限校验等横切逻辑
 */
export class AuthService {
  private adapter: IAuthService;

  constructor(type: 'mock'|'firebase'|'better'|'hybrid' = 'mock') {
    this.adapter = AuthServiceFactory.createService(type);
  }

  async initialize() { await this.adapter.initialize(); }
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    // 可扩展埋点、缓存等逻辑
    return this.adapter.loginWithEmail(email, password);
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    return this.adapter.loginWithPhone(phone, code);
  }
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    return this.adapter.loginWithProvider(provider, token);
  }
  async logout() { return this.adapter.logout(); }
  async getCurrentUser(): Promise<AuthUser|null> { return this.adapter.getCurrentUser(); }
  async refreshToken(): Promise<string> { return this.adapter.refreshToken(); }
}
