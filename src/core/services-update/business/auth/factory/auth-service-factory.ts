// 认证服务工厂
import { IAuthService } from '../types/auth-service';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { FirebaseAuthService } from '../adapters/firebase/firebase-auth-service';
import { BetterAuthService } from '../adapters/better/better-auth-service';

export function createAuthService(type: 'mock'|'firebase'|'better' = 'mock'): IAuthService {
  switch(type) {
    case 'firebase': return new FirebaseAuthService();
    case 'better': return new BetterAuthService();
    default: return new MockAuthService();
  }
}
