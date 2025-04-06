import { AuthServiceFactory } from '@/core/services/auth/auth-service-factory';
import { MockAuthProvider } from '@/core/services/auth/mock-auth-provider';
import { BetterAuthProvider } from '@/core/services/auth/better-auth-provider';
import { FirebaseAuthProvider } from '@/core/services/auth/firebase-auth-provider';

describe('AuthService', () => {
  let mockAuthService: MockAuthProvider;
  let betterAuthService: BetterAuthProvider;
  let firebaseAuthService: FirebaseAuthProvider;

  beforeEach(() => {
    // 重置所有服务实例
    AuthServiceFactory.getInstance().resetAuthService();
    
    // 创建新的服务实例
    mockAuthService = new MockAuthProvider({
      enableDelay: false,
      mockUserCount: 1,
      defaultPassword: 'test123',
      persistAuth: false
    });
    
    betterAuthService = BetterAuthProvider.getInstance();
    firebaseAuthService = FirebaseAuthProvider.getInstance();
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      
      // Mock Auth
      await expect(mockAuthService.sendPasswordResetEmail(email)).resolves.not.toThrow();
      
      // Better Auth
      await expect(betterAuthService.sendPasswordResetEmail(email)).resolves.not.toThrow();
      
      // Firebase Auth
      await expect(firebaseAuthService.sendPasswordResetEmail(email)).resolves.not.toThrow();
    });

    it('should verify password reset code', async () => {
      const code = '123456';
      
      // Mock Auth
      const mockEmail = await mockAuthService.verifyPasswordResetCode(code);
      expect(mockEmail).toBe('test@example.com');
      
      // Better Auth
      await expect(betterAuthService.verifyPasswordResetCode(code)).resolves.toBeDefined();
      
      // Firebase Auth
      await expect(firebaseAuthService.verifyPasswordResetCode(code)).resolves.toBeDefined();
    });

    it('should confirm password reset', async () => {
      const code = '123456';
      const newPassword = 'newPassword123';
      
      // Mock Auth
      await expect(mockAuthService.confirmPasswordReset(code, newPassword)).resolves.not.toThrow();
      
      // Better Auth
      await expect(betterAuthService.confirmPasswordReset(code, newPassword)).resolves.not.toThrow();
      
      // Firebase Auth
      await expect(firebaseAuthService.confirmPasswordReset(code, newPassword)).resolves.not.toThrow();
    });
  });

  describe('Email Verification', () => {
    it('should send email verification', async () => {
      // 先登录一个用户
      await mockAuthService.login('user1@example.com', 'test123');
      await betterAuthService.login('user1@example.com', 'test123');
      await firebaseAuthService.login('user1@example.com', 'test123');
      
      // Mock Auth
      await expect(mockAuthService.sendEmailVerification()).resolves.not.toThrow();
      
      // Better Auth
      await expect(betterAuthService.sendEmailVerification()).resolves.not.toThrow();
      
      // Firebase Auth
      await expect(firebaseAuthService.sendEmailVerification()).resolves.not.toThrow();
    });

    it('should apply action code', async () => {
      const code = '123456';
      
      // Mock Auth
      await expect(mockAuthService.applyActionCode(code)).resolves.not.toThrow();
      
      // Better Auth
      await expect(betterAuthService.applyActionCode(code)).resolves.not.toThrow();
      
      // Firebase Auth
      await expect(firebaseAuthService.applyActionCode(code)).resolves.not.toThrow();
    });
  });

  describe('User Profile Updates', () => {
    it('should update user email', async () => {
      const newEmail = 'new@example.com';
      
      // 先登录一个用户
      await mockAuthService.login('user1@example.com', 'test123');
      await betterAuthService.login('user1@example.com', 'test123');
      await firebaseAuthService.login('user1@example.com', 'test123');
      
      // Mock Auth
      await expect(mockAuthService.updateEmail(newEmail)).resolves.not.toThrow();
      expect(mockAuthService.getCurrentUser()?.email).toBe(newEmail);
      
      // Better Auth
      await expect(betterAuthService.updateEmail(newEmail)).resolves.not.toThrow();
      expect(betterAuthService.getCurrentUser()?.email).toBe(newEmail);
      
      // Firebase Auth
      await expect(firebaseAuthService.updateEmail(newEmail)).resolves.not.toThrow();
      expect(firebaseAuthService.getCurrentUser()?.email).toBe(newEmail);
    });

    it('should update user password', async () => {
      const newPassword = 'newPassword123';
      
      // 先登录一个用户
      await mockAuthService.login('user1@example.com', 'test123');
      await betterAuthService.login('user1@example.com', 'test123');
      await firebaseAuthService.login('user1@example.com', 'test123');
      
      // Mock Auth
      await expect(mockAuthService.updatePassword(newPassword)).resolves.not.toThrow();
      
      // Better Auth
      await expect(betterAuthService.updatePassword(newPassword)).resolves.not.toThrow();
      
      // Firebase Auth
      await expect(firebaseAuthService.updatePassword(newPassword)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthenticated operations', async () => {
      // 确保用户未登录
      await mockAuthService.logout();
      await betterAuthService.logout();
      await firebaseAuthService.logout();
      
      // 测试需要认证的操作
      const operations = [
        () => mockAuthService.sendEmailVerification(),
        () => mockAuthService.updateEmail('new@example.com'),
        () => mockAuthService.updatePassword('newPassword123'),
        () => betterAuthService.sendEmailVerification(),
        () => betterAuthService.updateEmail('new@example.com'),
        () => betterAuthService.updatePassword('newPassword123'),
        () => firebaseAuthService.sendEmailVerification(),
        () => firebaseAuthService.updateEmail('new@example.com'),
        () => firebaseAuthService.updatePassword('newPassword123')
      ];
      
      for (const operation of operations) {
        await expect(operation()).rejects.toThrow('No user is signed in');
      }
    });
  });
}); 