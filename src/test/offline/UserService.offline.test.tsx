import { User } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { NetworkService } from '@/core/services/network-service';
import { DataServiceFactory } from '@/core/lib/db/service';

// 模拟依赖
jest.mock('@/core/services/network-service');
jest.mock('@/core/lib/db/service');

describe('UserService Offline Tests', () => {
  // 用于恢复所有模拟的原始实现
  const originalNetworkStatus = NetworkService.isOnline;
  const originalFetch = global.fetch;

  // 测试数据
  const mockUser: Partial<User> = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    photos: [
      {
        id: 'photo-1',
        url: '/assets/images/profiles/photo-placeholder-1.jpg',
        isMain: true,
        order: 1,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  };

  // 每个测试前的设置
  beforeEach(() => {
    // 重置所有模拟
    jest.resetAllMocks();

    // 模拟fetch
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ users: [mockUser] })
      })
    ) as jest.Mock;

    // 设置模拟数据服务
    (DataServiceFactory.getInstance as jest.Mock).mockReturnValue({
      users: {
        get: jest.fn().mockResolvedValue(mockUser),
        getAll: jest.fn().mockResolvedValue([mockUser]),
        add: jest.fn().mockResolvedValue(mockUser.id),
        update: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(true),
      }
    });
  });

  // 每个测试后的清理
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  // 在所有测试完成后恢复原始实现
  afterAll(() => {
    NetworkService.isOnline = originalNetworkStatus;
  });

  it('should fetch user from cache when offline', async () => {
    // 模拟离线状态
    NetworkService.isOnline = jest.fn().mockReturnValue(false);

    // 测试获取用户
    const userService = new UserService();
    const user = await userService.getUser('user-123');

    // 验证结果
    expect(user).toEqual(mockUser);
    expect(NetworkService.isOnline).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(DataServiceFactory.getInstance().users.get).toHaveBeenCalledWith('user-123');
  });

  it('should update user locally when offline', async () => {
    // 模拟离线状态
    NetworkService.isOnline = jest.fn().mockReturnValue(false);
    
    // 测试更新用户
    const userService = new UserService();
    const updatedUser = { ...mockUser, name: 'Updated Name' } as User;
    await userService.updateUser(updatedUser);

    // 验证结果
    expect(NetworkService.isOnline).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(DataServiceFactory.getInstance().users.update).toHaveBeenCalledWith(updatedUser);
  });

  it('should queue operations for sync when offline', async () => {
    // 模拟离线状态
    NetworkService.isOnline = jest.fn().mockReturnValue(false);
    
    // 模拟同步队列
    const mockAddToSyncQueue = jest.fn();
    (UserService.prototype as any).addToSyncQueue = mockAddToSyncQueue;
    
    // 执行离线操作
    const userService = new UserService();
    const newUser = { ...mockUser, id: 'new-user-123', name: 'New User' } as User;
    await userService.addUser(newUser);

    // 验证结果
    expect(DataServiceFactory.getInstance().users.add).toHaveBeenCalledWith(newUser);
    expect(mockAddToSyncQueue).toHaveBeenCalledWith({
      type: 'ADD_USER',
      payload: newUser,
      timestamp: expect.any(Number)
    });
  });

  it('should sync queued operations when coming back online', async () => {
    // 初始离线状态
    NetworkService.isOnline = jest.fn().mockReturnValue(false);
    
    // 模拟同步队列
    (UserService.prototype as any).syncQueue = [
      {
        type: 'UPDATE_USER',
        payload: { ...mockUser, name: 'Updated Offline' },
        timestamp: Date.now()
      }
    ];
    
    // 模拟同步方法
    const mockSyncQueuedOperations = jest.fn().mockResolvedValue(true);
    (UserService.prototype as any).syncQueuedOperations = mockSyncQueuedOperations;
    
    // 模拟联网事件
    const onlineCallback = jest.fn();
    window.addEventListener = jest.fn((event, callback) => {
      if (event === 'online') {
        onlineCallback.mockImplementation(callback);
      }
    });
    
    // 创建服务实例（会注册online事件监听器）
    const userService = new UserService();
    
    // 现在切换到在线状态并触发online事件
    NetworkService.isOnline = jest.fn().mockReturnValue(true);
    onlineCallback();
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 验证同步被调用
    expect(mockSyncQueuedOperations).toHaveBeenCalled();
  });

  it('should handle conflicts during sync', async () => {
    // 模拟在线状态
    NetworkService.isOnline = jest.fn().mockReturnValue(true);
    
    // 模拟本地和远程数据冲突
    const localUser = { ...mockUser, name: 'Local Change', updatedAt: new Date(Date.now() - 1000) };
    const remoteUser = { ...mockUser, name: 'Remote Change', updatedAt: new Date() };
    
    // 模拟数据服务返回本地版本
    (DataServiceFactory.getInstance().users.get as jest.Mock).mockResolvedValue(localUser);
    
    // 模拟服务器返回远程版本
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(remoteUser)
      })
    ) as jest.Mock;
    
    // 模拟冲突解决策略（这里使用服务器优先策略）
    (UserService.prototype as any).resolveConflict = jest.fn().mockImplementation(
      (local, remote) => Promise.resolve(remote)
    );
    
    // 测试获取用户并处理冲突
    const userService = new UserService();
    const user = await userService.getUser('user-123');
    
    // 验证结果（应该返回合并后的数据，在这种情况下是远程数据）
    expect(user).toEqual(remoteUser);
    expect((UserService.prototype as any).resolveConflict).toHaveBeenCalledWith(
      localUser,
      remoteUser
    );
    expect(DataServiceFactory.getInstance().users.update).toHaveBeenCalledWith(remoteUser);
  });

  it('should handle network errors gracefully', async () => {
    // 模拟在线状态但网络请求失败
    NetworkService.isOnline = jest.fn().mockReturnValue(true);
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;
    
    // 模拟控制台错误以避免测试输出噪音
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      // 测试获取用户
      const userService = new UserService();
      const user = await userService.getUser('user-123');
      
      // 验证在网络错误的情况下仍然返回本地数据
      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalled();
      expect(DataServiceFactory.getInstance().users.get).toHaveBeenCalledWith('user-123');
      expect(console.error).toHaveBeenCalled();
    } finally {
      // 恢复控制台错误
      console.error = originalConsoleError;
    }
  });
}); 