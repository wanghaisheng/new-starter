/**
 * MessageService 离线功能测试
 * 
 * 测试 MessageService 在离线环境下的行为
 */

import { MessageService } from '@/core/services/message-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';
import { Message } from '@/core/lib/db/types/message';

// 扩展全局接口以包含测试辅助函数
declare global {
  namespace NodeJS {
    interface Global {
      simulateSyncDelay: (ms?: number) => Promise<void>;
    }
  }
}

// 扩展Message类型
interface MessageWithReadStatus extends Partial<Message> {
  isRead?: boolean;
}

// 定义模拟类型
interface MockNetworkService {
  isOnline: jest.Mock;
  addNetworkStatusListener: jest.Mock;
  removeNetworkStatusListener: jest.Mock;
}

interface MockDatabaseService {
  get: jest.Mock;
  getAll: jest.Mock;
  add: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  query: jest.Mock;
}

interface MockSyncQueue {
  addToQueue: jest.Mock;
  processSyncQueue: jest.Mock;
  getSyncQueue: jest.Mock;
}

// 模拟NetworkService
jest.mock('@/core/services/network-service', () => ({
  NetworkService: {
    getInstance: jest.fn(() => ({
      isOnline: jest.fn(),
      addNetworkStatusListener: jest.fn(),
      removeNetworkStatusListener: jest.fn(),
    })),
    isOnline: jest.fn(),
  }
}));

// 模拟DatabaseService
jest.mock('@/core/lib/db/service', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      getAll: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      query: jest.fn(),
    })),
  }
}));

// 模拟同步队列模块
jest.mock('@/core/lib/db/sync/queue', () => ({
  addToQueue: jest.fn(),
  processSyncQueue: jest.fn(),
  getSyncQueue: jest.fn(),
}));

// 创建模拟数据
const mockMessages: MessageWithReadStatus[] = [
  {
    id: 'msg-1',
    matchId: 'match-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Hello there!',
    createdAt: new Date('2023-04-01T10:00:00Z'),
    updatedAt: new Date('2023-04-01T10:00:00Z'),
    status: 'sent',
    isRead: false,
  },
  {
    id: 'msg-2',
    matchId: 'match-1',
    senderId: 'user-2',
    receiverId: 'user-1',
    content: 'Hi! How are you?',
    createdAt: new Date('2023-04-01T10:05:00Z'),
    updatedAt: new Date('2023-04-01T10:05:00Z'),
    status: 'sent',
    isRead: true,
  }
];

describe('MessageService Offline Tests', () => {
  // 声明测试变量
  let messageService: any;
  let networkServiceMock: MockNetworkService;
  let databaseServiceMock: MockDatabaseService;
  let syncQueueMock: MockSyncQueue;
  
  // 模拟simulateSyncDelay函数，如果不存在
  const mockSimulateSyncDelay = async (ms: number = 100) => {
    jest.advanceTimersByTime(ms);
    await new Promise(resolve => setTimeout(resolve, 10));
  };
  
  // 在每个测试前设置
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 确保全局辅助函数存在
    if (!global.simulateSyncDelay) {
      global.simulateSyncDelay = mockSimulateSyncDelay;
    }
    
    // 设置模拟实现
    databaseServiceMock = DatabaseService.getInstance() as unknown as MockDatabaseService;
    networkServiceMock = NetworkService.getInstance() as unknown as MockNetworkService;
    
    // 获取同步队列模拟
    syncQueueMock = require('@/core/lib/db/sync/queue') as MockSyncQueue;
    
    // 获取服务实例
    messageService = MessageService.getInstance();
  });
  
  // 离线数据获取测试
  it('应该在离线时从缓存获取消息', async () => {
    // 模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 模拟数据库返回
    databaseServiceMock.query.mockResolvedValue(mockMessages);
    
    // 执行测试的方法
    const result = await messageService.getMessages('match-1');
    
    // 验证结果
    expect(networkServiceMock.isOnline).toHaveBeenCalled();
    expect(databaseServiceMock.query).toHaveBeenCalledWith('messages', { matchId: 'match-1' });
    expect(result).toEqual(mockMessages);
  });
  
  // 离线发送消息测试
  it('应该在离线时将消息存储在本地并加入同步队列', async () => {
    // 模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 模拟数据库添加成功
    const newMessageId = 'msg-3';
    databaseServiceMock.add.mockResolvedValue({ id: newMessageId });
    
    // 执行离线发送消息
    const message = {
      matchId: 'match-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      content: 'Are you there?',
    };
    
    await messageService.sendMessage(
      message.matchId, 
      message.senderId, 
      message.receiverId, 
      message.content
    );
    
    // 验证消息已添加到本地数据库
    expect(databaseServiceMock.add).toHaveBeenCalledWith(
      'messages',
      expect.objectContaining({
        matchId: message.matchId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        status: 'pending', // 在离线状态下应将状态设为pending
      })
    );
    
    // 验证消息已添加到同步队列
    expect(syncQueueMock.addToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SEND_MESSAGE',
        payload: expect.objectContaining({
          id: newMessageId,
          matchId: message.matchId,
          content: message.content,
        })
      })
    );
  });
  
  // 网络恢复同步测试
  it('应该在网络恢复时同步离线发送的消息', async () => {
    // 模拟同步队列中的待发送消息
    const pendingMessages = [
      {
        type: 'SEND_MESSAGE',
        payload: {
          id: 'msg-3',
          matchId: 'match-1',
          senderId: 'user-1',
          receiverId: 'user-2',
          content: 'Offline message',
          status: 'pending',
        },
        timestamp: Date.now(),
      }
    ];
    
    // 模拟获取同步队列
    syncQueueMock.getSyncQueue.mockReturnValue(pendingMessages);
    
    // 首先模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 然后模拟网络恢复
    networkServiceMock.isOnline.mockReturnValue(true);
    
    // 触发网络恢复事件
    const onlineCallback = networkServiceMock.addNetworkStatusListener.mock.calls[0][0];
    onlineCallback(true);
    
    // 等待同步完成 - 使用同步延迟辅助函数
    await mockSimulateSyncDelay(100);
    
    // 验证同步处理已执行
    expect(syncQueueMock.processSyncQueue).toHaveBeenCalled();
    
    // 验证数据库更新，消息状态应改为'sent'
    expect(databaseServiceMock.update).toHaveBeenCalledWith(
      'messages',
      'msg-3',
      expect.objectContaining({
        status: 'sent',
      })
    );
  });
  
  // 消息读取状态同步测试
  it('应该在离线时将消息标记为已读并在联网后同步', async () => {
    // 模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 模拟数据库更新成功
    databaseServiceMock.update.mockResolvedValue({ id: 'msg-2', isRead: true });
    
    // 执行标记消息为已读
    await messageService.markMessageAsRead('msg-2');
    
    // 验证本地数据库更新
    expect(databaseServiceMock.update).toHaveBeenCalledWith(
      'messages',
      'msg-2',
      expect.objectContaining({
        isRead: true
      })
    );
    
    // 验证操作已添加到同步队列
    expect(syncQueueMock.addToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MARK_MESSAGE_READ',
        payload: expect.objectContaining({
          id: 'msg-2',
        })
      })
    );
  });
  
  // 网络错误处理测试
  it('应该优雅地处理消息发送时的网络错误', async () => {
    // 模拟联网但请求失败的情况
    networkServiceMock.isOnline.mockReturnValue(true);
    
    // 模拟API调用失败
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    // 执行发送消息
    const message = {
      matchId: 'match-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      content: 'Test message',
    };
    
    await messageService.sendMessage(
      message.matchId, 
      message.senderId, 
      message.receiverId, 
      message.content
    );
    
    // 验证错误处理 - 应该将消息存储在本地并加入同步队列
    expect(databaseServiceMock.add).toHaveBeenCalledWith(
      'messages',
      expect.objectContaining({
        matchId: message.matchId,
        status: 'failed', // 在发送失败时状态应为failed
      })
    );
    
    // 验证消息被添加到同步队列以便稍后重试
    expect(syncQueueMock.addToQueue).toHaveBeenCalled();
  });
});
