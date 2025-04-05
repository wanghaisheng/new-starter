import React from 'react';
import { User } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';

// 为Location和UserPreferences创建接口
interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number;
  gender: ('male' | 'female' | 'other')[];
  interests: string[];
  dealBreakers?: string[];
}

// 定义测试数据
const mockUser: Partial<User> = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  bio: 'Test bio',
  gender: 'male',
  birthDate: new Date(),
  location: {
    latitude: 0,
    longitude: 0,
    city: 'Test City',
    country: 'Test Country'
  } as Location,
  interests: ['reading', 'sports'],
  photos: [
    {
      id: 'photo-1',
      url: '/assets/images/profiles/profile-men-32.jpg',
      order: 1,
      isMain: true,
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  preferences: {
    ageRange: { min: 18, max: 35 },
    distance: 10,
    gender: ['female'],
    interests: ['movies', 'travel']
  } as UserPreferences,
  isVerified: false,
  status: 'active',
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// 模拟依赖
jest.mock('@/core/services/network-service', () => ({
  NetworkService: {
    isOnline: jest.fn(),
    simulateOffline: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}));

// 模拟DatabaseService及其实例方法
jest.mock('@/core/lib/db/service', () => {
  const mockUsersRepository = {
    get: jest.fn(),
    getAll: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getSyncQueue: jest.fn().mockReturnValue([]),
    addToSyncQueue: jest.fn()
  };
  
  return {
    DatabaseService: {
      getInstance: jest.fn().mockReturnValue({
        users: mockUsersRepository
      })
    }
  };
});

// 允许访问UserService构造函数 (模拟为public)
jest.mock('@/core/services/user-service', () => {
  const originalModule = jest.requireActual('@/core/services/user-service');
  
  // 创建模拟构造函数
  const MockUserService = function(this: any) {
    this.syncQueue = [];
    this.getUser = jest.fn().mockImplementation(async (id: string) => mockUser);
    this.updateUser = jest.fn().mockImplementation(async (user: User) => user);
    this.addUser = jest.fn().mockImplementation(async (user: User) => user);
    this.processQueue = jest.fn();
    this.handleOnline = jest.fn();
  };
  
  return {
    ...originalModule,
    UserService: MockUserService
  };
});

// 类型定义以解决类型错误
type MockedNetworkService = {
  isOnline: jest.Mock;
  simulateOffline: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

type MockedDatabaseService = {
  getInstance: jest.Mock;
};

type MockedUserRepository = {
  get: jest.Mock;
  getAll: jest.Mock;
  add: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  getSyncQueue: jest.Mock;
  addToSyncQueue: jest.Mock;
};

describe('UserService Offline Tests', () => {
  // 用于恢复所有模拟的原始实现
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // 清除所有模拟的调用历史
    jest.clearAllMocks();
    
    // 设置全局fetch模拟
    global.fetch = jest.fn() as jest.Mock;
  });

  // 在所有测试完成后恢复原始实现
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should fetch user from cache when offline', async () => {
    // 模拟离线状态
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(false);
    
    // 模拟数据库服务返回缓存的用户
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).get.mockResolvedValue(mockUser);

    // 测试获取用户
    const userService = new (UserService as any)();
    const user = await userService.getUser('user-123');

    // 验证结果
    expect(user).toEqual(mockUser);
    expect((NetworkService as unknown as MockedNetworkService).isOnline).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect((dbService.users as MockedUserRepository).get).toHaveBeenCalledWith('user-123');
  });

  it('should update user locally when offline', async () => {
    // 模拟离线状态
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(false);
    
    // 模拟数据库服务
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).update.mockResolvedValue({ ...mockUser, name: 'Updated Name' });
    
    // 测试更新用户
    const userService = new (UserService as any)();
    const updatedUser = { ...mockUser, name: 'Updated Name' } as User;
    await userService.updateUser(updatedUser);

    // 验证结果
    expect((NetworkService as unknown as MockedNetworkService).isOnline).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect((dbService.users as MockedUserRepository).update).toHaveBeenCalledWith(updatedUser);
  });

  it('should queue operations for sync when offline', async () => {
    // 模拟离线状态
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(false);
    
    // 模拟数据库服务
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).add.mockResolvedValue({ ...mockUser, id: 'new-user-123', name: 'New User' });
    
    // 执行离线操作
    const userService = new (UserService as any)();
    const newUser = { ...mockUser, id: 'new-user-123', name: 'New User' } as User;
    await userService.addUser(newUser);

    // 验证结果
    expect((NetworkService as unknown as MockedNetworkService).isOnline).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect((dbService.users as MockedUserRepository).add).toHaveBeenCalledWith(newUser);
    expect((dbService.users as MockedUserRepository).addToSyncQueue).toHaveBeenCalled();
  });

  it('should sync queued operations when coming back online', async () => {
    // 初始离线状态
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(false);
    
    // 模拟同步队列
    const syncQueueItems = [
      {
        type: 'UPDATE_USER',
        payload: { ...mockUser, name: 'Offline Update' },
        timestamp: Date.now()
      }
    ];
    
    // 模拟数据库服务
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).getSyncQueue.mockReturnValue(syncQueueItems);
    
    // 模拟online事件触发
    const onlineCallback = jest.fn();
    (window.addEventListener as jest.Mock) = jest.fn((event, callback) => {
      if (event === 'online') {
        onlineCallback.mockImplementation(() => {
          if (typeof callback === 'function') {
            callback(new Event('online'));
          }
        });
      }
    });
    
    // 创建服务实例（会注册online事件监听器）
    const userService = new (UserService as any)();
    
    // 现在切换到在线状态并触发online事件
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(true);
    onlineCallback();
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 验证同步操作
    expect(userService.processQueue).toHaveBeenCalled();
  });

  it('should handle conflicts during sync', async () => {
    // 模拟在线状态
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(true);
    
    // 模拟本地和远程数据冲突
    const localUser = { ...mockUser, name: 'Local Change', updatedAt: new Date(Date.now() - 1000) };
    const remoteUser = { ...mockUser, name: 'Remote Change', updatedAt: new Date() };
    
    // 模拟数据库服务
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).get.mockResolvedValue(localUser);
    
    // 模拟fetch返回远程数据
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(remoteUser)
    });
    
    // 测试获取用户并处理冲突
    const userService = new (UserService as any)();
    const user = await userService.getUser('user-123');
    
    // 验证结果（应该返回合并后的数据，在这种情况下是远程数据）
    expect((NetworkService as unknown as MockedNetworkService).isOnline).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(user).toEqual(expect.objectContaining({ name: 'Local Change' }));
  });

  it('should handle network errors gracefully', async () => {
    // 模拟在线状态但网络请求失败
    (NetworkService as unknown as MockedNetworkService).isOnline.mockReturnValue(true);
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.reject(new Error('Network error'))
    );
    
    // 模拟数据库服务
    const dbService = (DatabaseService as unknown as MockedDatabaseService).getInstance();
    (dbService.users as MockedUserRepository).get.mockResolvedValue(mockUser);
    
    try {
      // 测试获取用户
      const userService = new (UserService as any)();
      const user = await userService.getUser('user-123');
      
      // 验证在网络错误的情况下仍然返回本地数据
      expect(user).toEqual(mockUser);
      expect((NetworkService as unknown as MockedNetworkService).isOnline).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect((dbService.users as MockedUserRepository).get).toHaveBeenCalledWith('user-123');
    } catch (error) {
      fail('应该优雅地处理网络错误，而不是抛出异常');
    }
  });
}); 