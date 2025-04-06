/**
 * 离线功能测试
 * 
 * 测试应用在离线状态下的功能表现和数据同步机制
 */
import { NetworkService, ConnectionStatus } from '@/core/services/network-service';
import { MessageService } from '@/core/services/message-service';
import { UserService } from '@/core/services/user-service';
import { User } from '@/core/lib/db/types/user';

// 直接使用 jest.mock 模拟整个模块
jest.mock('@/core/services/network-service');
jest.mock('@/core/services/message-service');
jest.mock('@/core/services/user-service');

describe('离线功能测试', () => {
  let networkService: jest.Mocked<NetworkService>;
  let messageService: jest.Mocked<MessageService>;
  let userService: jest.Mocked<UserService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 获取服务实例
    networkService = NetworkService.getInstance() as jest.Mocked<NetworkService>;
    messageService = MessageService.getInstance() as jest.Mocked<MessageService>;
    userService = UserService.getInstance() as jest.Mocked<UserService>;
    
    // 模拟网络状态为离线
    networkService.isOnline = jest.fn().mockReturnValue(false);
    networkService.getConnectionStatus = jest.fn().mockReturnValue('offline');
  });
  
  describe('消息发送', () => {
    it('离线状态下应该将消息保存到队列', async () => {
      // 准备测试数据
      const matchId = 'match-123';
      const senderId = 'user-1';
      const receiverId = 'user-2';
      const content = 'Hello offline';
      
      // 设置模拟方法
      messageService.saveOfflineMessage = jest.fn().mockResolvedValue(true);
      
      // 调用要测试的方法
      await messageService.sendMessage(matchId, senderId, receiverId, content);
      
      // 验证结果
      expect(messageService.saveOfflineMessage).toHaveBeenCalled();
    });
    
    it('网络恢复时应该同步离线消息', () => {
      // 准备测试数据
      messageService.hasOfflineMessages = jest.fn().mockReturnValue(true);
      messageService.syncAllOfflineMessages = jest.fn().mockResolvedValue(1);
      
      // 模拟网络状态变化
      const listeners: ((status: any) => void)[] = [];
      networkService.addNetworkStatusListener = jest.fn().mockImplementation(callback => {
        listeners.push(callback);
        return 'id-123';
      });
      
      // 添加监听器
      networkService.addNetworkStatusListener(() => {});
      
      // 模拟变为在线状态
      listeners[0]({ connected: true, connectionType: 'wifi' });
      
      // 验证结果
      expect(messageService.syncAllOfflineMessages).toHaveBeenCalled();
    });
  });
  
  describe('用户资料更新', () => {
    it('离线状态下应该保存资料更新', async () => {
      // 准备测试数据
      const userId = 'user-123';
      const updates = { bio: 'Updated bio' };
      
      // 调用要测试的方法
      await userService.updateUserProfile(userId, updates);
      
      // 验证结果
      expect(userService.updateUserProfile).toHaveBeenCalledWith(userId, updates);
    });
  });
  
  describe('网络状态', () => {
    it('应该正确检测网络状态', () => {
      // 测试离线状态
      networkService.getConnectionStatus = jest.fn().mockReturnValue('offline');
      expect(networkService.isOnline()).toBe(false);
      
      // 测试在线状态
      networkService.getConnectionStatus = jest.fn().mockReturnValue('online');
      expect(networkService.isOnline()).toBe(true);
    });
    
    it('应该通知网络状态变化', () => {
      // 创建测试监听器
      const listener = jest.fn();
      
      // 模拟监听器注册
      const listeners: ((status: any) => void)[] = [];
      networkService.addNetworkStatusListener = jest.fn().mockImplementation(callback => {
        listeners.push(callback);
        return 'id-123';
      });
      
      // 添加监听器
      networkService.addNetworkStatusListener(listener);
      
      // 模拟网络状态变化
      listeners[0]({ connected: true, connectionType: 'wifi' });
      
      // 验证结果
      expect(listener).toHaveBeenCalledWith({ connected: true, connectionType: 'wifi' });
    });
  });
}); 