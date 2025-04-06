import { AuthServiceFactory } from '@/core/services/auth-service';
import { DatabaseService } from '@/core/services/database-service';
import { UserService } from '@/core/services/user-service';
import { NetworkService } from '@/core/services/network-service';
import { User } from '@/core/lib/db/types';
import { IDataService } from '@/core/services/data-service-interface';

describe('AuthService Integration', () => {
  let authService: any;
  let dbService: IDataService;
  let userService: UserService;
  let networkService: NetworkService;

  beforeEach(() => {
    // 重置所有服务实例
    AuthServiceFactory.getInstance().resetAuthService();
    
    // 获取服务实例
    authService = AuthServiceFactory.getInstance().getAuthService();
    dbService = DatabaseService.getInstance();
    userService = UserService.getInstance();
    networkService = NetworkService.getInstance();
  });

  describe('Authentication Flow', () => {
    it('should complete a full authentication flow', async () => {
      // 注册新用户
      const userData: Partial<User> = {
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        interests: ['testing']
      };
      
      const user = await authService.register(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      
      // 发送验证邮件
      await authService.sendEmailVerification();
      
      // 应用验证码
      await authService.applyActionCode('verification-code');
      
      // 登录
      const loggedInUser = await authService.login('test@example.com', 'password123');
      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.email).toBe('test@example.com');
      
      // 更新个人资料
      const updatedUser = await authService.updateProfile({
        name: 'Updated Name',
        bio: 'Updated bio'
      });
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.bio).toBe('Updated bio');
      
      // 更新邮箱
      await authService.updateEmail('new@example.com');
      const userAfterEmailUpdate = await authService.getCurrentUser();
      expect(userAfterEmailUpdate?.email).toBe('new@example.com');
      
      // 更新密码
      await authService.updatePassword('newpassword123');
      
      // 登出
      await authService.logout();
      const userAfterLogout = await authService.getCurrentUser();
      expect(userAfterLogout).toBeNull();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete a password reset flow', async () => {
      // 发送重置邮件
      await authService.sendPasswordResetEmail('test@example.com');
      
      // 验证重置码
      const email = await authService.verifyPasswordResetCode('reset-code');
      expect(email).toBe('test@example.com');
      
      // 确认重置
      await authService.confirmPasswordReset('reset-code', 'newpassword123');
      
      // 使用新密码登录
      const user = await authService.login('test@example.com', 'newpassword123');
      expect(user).toBeDefined();
    });
  });

  describe('Network Integration', () => {
    it('should handle offline scenarios', async () => {
      // 模拟离线状态
      networkService.simulateOffline(true);
      
      // 尝试需要网络的操作
      await expect(authService.sendEmailVerification()).rejects.toThrow();
      
      // 恢复在线状态
      networkService.setOfflineMode(false);
      
      // 操作应该成功
      await expect(authService.sendEmailVerification()).resolves.not.toThrow();
    });
  });

  describe('Database Integration', () => {
    it('should sync user data with database', async () => {
      // 更新用户资料
      const updatedUser = await authService.updateProfile({
        name: 'New Name',
        bio: 'New bio'
      });
      
      // 更新数据库中的用户数据
      await dbService.updateUser(updatedUser.id, {
        name: 'New Name',
        bio: 'New bio'
      });
      
      // 从数据库获取用户
      const dbUser = await dbService.getUser(updatedUser.id);
      if (!dbUser) {
        throw new Error('User not found in database');
      }
      expect(dbUser.name).toBe('New Name');
      expect(dbUser.bio).toBe('New bio');
    });
  });

  describe('User Service Integration', () => {
    it('should sync user data with user service', async () => {
      // 通过认证服务更新用户
      const updatedUser = await authService.updateProfile({
        name: 'Service Name',
        bio: 'Service bio'
      });
      
      // 通过用户服务获取用户
      const userServiceUser = await userService.getUserById(updatedUser.id);
      if (!userServiceUser) {
        throw new Error('User not found in user service');
      }
      expect(userServiceUser.name).toBe('Service Name');
      expect(userServiceUser.bio).toBe('Service bio');
    });
  });
}); 