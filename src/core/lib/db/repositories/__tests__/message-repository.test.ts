import { MessageRepository } from '@/core/lib/db/repositories/message-repository';
import { Message } from '@/core/lib/db/models/message';
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { QueryResult } from '@/core/lib/db/types/database.types';

// 创建模拟数据库客户端
const mockDatabaseClient: jest.Mocked<IBaseDatabaseClient> = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  batch: jest.fn(),
  beginTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  executeRawQuery: jest.fn(),
  close: jest.fn(),
  isConnectionOpen: jest.fn(),
  getConnectionStatus: jest.fn(),
  getConfig: jest.fn(),
};

describe('MessageRepository', () => {
  let messageRepository: MessageRepository;
  
  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 创建 MessageRepository 实例
    messageRepository = new MessageRepository(mockDatabaseClient);
  });
  
  describe('findById', () => {
    it('should return message when found', async () => {
      // 设置模拟函数返回值
      const mockMessage = new Message({
        id: '123',
        matchId: 'match-123',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: 'Hello world',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      mockDatabaseClient.findById.mockResolvedValue(mockMessage);
      
      // 调用被测试方法
      const result = await messageRepository.findById('123');
      
      // 验证结果
      expect(result).toEqual(mockMessage);
      expect(mockDatabaseClient.findById).toHaveBeenCalledWith('messages', '123');
    });
    
    it('should return null when message not found', async () => {
      // 设置模拟函数返回值
      mockDatabaseClient.findById.mockResolvedValue(null);
      
      // 调用被测试方法
      const result = await messageRepository.findById('non-existent');
      
      // 验证结果
      expect(result).toBeNull();
      expect(mockDatabaseClient.findById).toHaveBeenCalledWith('messages', 'non-existent');
    });
  });
  
  describe('findAll', () => {
    it('should correctly handle array return', async () => {
      // 设置模拟数据
      const mockMessages = [
        new Message({
          id: '123',
          matchId: 'match-123',
          senderId: 'user-1',
          receiverId: 'user-2',
          content: 'Hello',
          type: 'text',
          status: 'sent',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        new Message({
          id: '456',
          matchId: 'match-123',
          senderId: 'user-2',
          receiverId: 'user-1',
          content: 'Hi there',
          type: 'text',
          status: 'read',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ];
      
      // 直接返回数组
      mockDatabaseClient.findAll.mockResolvedValue(mockMessages);
      
      // 调用被测试方法
      const result = await messageRepository.findAll();
      
      // 验证结果
      expect(result).toEqual(mockMessages);
      expect(mockDatabaseClient.findAll).toHaveBeenCalledWith('messages', undefined);
    });
  });
  
  describe('getMessagesForMatch', () => {
    it('should return messages for a specific match', async () => {
      // 设置模拟数据
      const mockMessages = [
        new Message({
          id: '123',
          matchId: 'match-123',
          senderId: 'user-1',
          receiverId: 'user-2',
          content: 'Hello',
          type: 'text',
          status: 'sent',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        new Message({
          id: '456',
          matchId: 'match-123',
          senderId: 'user-2',
          receiverId: 'user-1',
          content: 'Hi there',
          type: 'text',
          status: 'read',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ];
      
      // 使用query方法的返回值
      mockDatabaseClient.query.mockResolvedValue({
        data: mockMessages,
        total: mockMessages.length,
        hasMore: false
      });
      
      // 调用被测试方法
      const result = await messageRepository.getMessagesForMatch('match-123');
      
      // 验证结果
      expect(result).toEqual(mockMessages);
      expect(mockDatabaseClient.query).toHaveBeenCalledWith('messages', {
        where: { matchId: 'match-123' },
        orderBy: { createdAt: 'asc' }
      });
    });
  });
  
  describe('create', () => {
    it('should create a message and handle sync metadata for offline tables', async () => {
      // 设置模拟返回值
      const newMessage = new Message({
        id: '123',
        matchId: 'match-123',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: 'New message',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      mockDatabaseClient.create.mockResolvedValue(newMessage);
      
      // 模拟 isOfflineOnly 方法返回 true
      jest.spyOn(messageRepository as any, 'isOfflineOnly').mockReturnValue(true);
      
      // 准备创建消息的数据
      const messageData = {
        matchId: 'match-123',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: 'New message',
        type: 'text' as const,
        status: 'sent' as const
      };
      
      // 调用被测试方法
      const result = await messageRepository.create(messageData);
      
      // 验证结果
      expect(mockDatabaseClient.create).toHaveBeenCalledWith('messages', messageData);
      
      // 验证同步元数据 (如果需要的话)
    });
  });
  
  describe('update', () => {
    it('should update a message and handle sync metadata for offline tables', async () => {
      // 模拟 isOfflineOnly 方法返回 true
      jest.spyOn(messageRepository as any, 'isOfflineOnly').mockReturnValue(true);
      
      // 调用被测试方法
      await messageRepository.update('123', { status: 'read' });
      
      // 验证结果 - 应包含同步元数据
      expect(mockDatabaseClient.update).toHaveBeenCalledWith('messages', '123', {
        status: 'read',
        _sync: expect.objectContaining({
          syncState: 'synced',
          localModifiedAt: expect.any(Date)
        })
      });
    });
    
    it('should update a message without sync metadata for normal tables', async () => {
      // 模拟 isOfflineOnly 方法返回 false
      jest.spyOn(messageRepository as any, 'isOfflineOnly').mockReturnValue(false);
      
      // 调用被测试方法
      await messageRepository.update('123', { status: 'read' });
      
      // 验证结果 - 不应该包含同步元数据
      expect(mockDatabaseClient.update).toHaveBeenCalledWith('messages', '123', { status: 'read' });
    });
  });
  
  describe('findByMatchId', () => {
    it('should find messages by match ID and sort them by creation time', async () => {
      // 设置模拟数据
      const mockDate1 = new Date('2023-01-01T10:00:00Z');
      const mockDate2 = new Date('2023-01-01T10:05:00Z');
      
      const mockMessages = [
        new Message({
          id: '1',
          matchId: 'match1',
          senderId: 'user1',
          receiverId: 'user2',
          content: 'First message',
          type: 'text',
          status: 'sent',
          createdAt: mockDate1,
          updatedAt: mockDate1
        }),
        new Message({
          id: '2',
          matchId: 'match1',
          senderId: 'user2',
          receiverId: 'user1',
          content: 'Second message',
          type: 'text',
          status: 'read',
          createdAt: mockDate2,
          updatedAt: mockDate2
        })
      ];
      
      // 测试 QueryResult 格式的返回值
      const mockQueryResult: QueryResult<Message> = {
        data: mockMessages,
        total: mockMessages.length,
        limit: 10,
        offset: 0
      };
      
      mockDatabaseClient.query.mockResolvedValue(mockQueryResult);
      
      // 调用被测试方法
      const result = await messageRepository.findByMatchId('match1');
      
      // 验证结果
      expect(result).toEqual(mockMessages);
      expect(mockDatabaseClient.query).toHaveBeenCalledWith('messages', {
        where: { matchId: 'match1' },
        orderBy: { createdAt: 'asc' }
      });
    });
  });
  
  describe('findUnreadByReceiverId', () => {
    it('should find unread messages for a receiver', async () => {
      // 设置模拟数据
      const mockMessages = [
        new Message({
          id: '1',
          matchId: 'match1',
          senderId: 'user1',
          receiverId: 'user2',
          content: 'Unread message',
          type: 'text',
          status: 'sent',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ];
      
      // 测试 QueryResult 格式的返回值
      const mockQueryResult: QueryResult<Message> = {
        data: mockMessages,
        total: mockMessages.length,
        limit: 10,
        offset: 0
      };
      
      mockDatabaseClient.query.mockResolvedValue(mockQueryResult);
      
      // 调用被测试方法
      const result = await messageRepository.findUnreadByReceiverId('user2');
      
      // 验证结果
      expect(result).toEqual(mockMessages);
      expect(mockDatabaseClient.query).toHaveBeenCalledWith('messages', {
        where: { 
          receiverId: 'user2',
          status: { $ne: 'read' }
        }
      });
    });
  });
  
  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      // 调用被测试方法
      await messageRepository.markAsRead('message1');
      
      // 验证结果
      expect(mockDatabaseClient.update).toHaveBeenCalledWith('messages', 'message1', {
        status: 'read',
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('markAllAsReadInMatch', () => {
    it('should execute raw query to mark all messages as read in match for a receiver', async () => {
      // 设置模拟查询结果
      mockDatabaseClient.executeRawQuery.mockResolvedValue([{ affected: 3 }]);
      
      // 调用被测试方法
      const result = await messageRepository.markAllAsReadInMatch('match1', 'user2');
      
      // 验证结果
      expect(result).toBe(3);
      expect(mockDatabaseClient.executeRawQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages'),
        expect.arrayContaining(['match1', 'user2', 'read'])
      );
    });
  });
  
  describe('getLastMessageByMatchId', () => {
    it('should return last message in a match', async () => {
      // 设置模拟数据
      const mockMessage = new Message({
        id: '2',
        matchId: 'match1',
        senderId: 'user2',
        receiverId: 'user1',
        content: 'Last message',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 测试 QueryResult 格式的返回值
      const mockQueryResult: QueryResult<Message> = {
        data: [mockMessage],
        total: 1,
        limit: 1,
        offset: 0
      };
      
      mockDatabaseClient.query.mockResolvedValue(mockQueryResult);
      
      // 调用被测试方法
      const result = await messageRepository.getLastMessageByMatchId('match1');
      
      // 验证结果
      expect(result).toEqual(mockMessage);
      expect(mockDatabaseClient.query).toHaveBeenCalledWith('messages', {
        where: { matchId: 'match1' },
        orderBy: { createdAt: 'desc' },
        limit: 1
      });
    });
    
    it('should return null if no messages in match', async () => {
      // 测试空 QueryResult
      const emptyQueryResult: QueryResult<Message> = {
        data: [],
        total: 0,
        limit: 1,
        offset: 0
      };
      
      mockDatabaseClient.query.mockResolvedValue(emptyQueryResult);
      
      // 调用被测试方法
      const result = await messageRepository.getLastMessageByMatchId('match1');
      
      // 验证结果
      expect(result).toBeNull();
    });
  });
  
  describe('getUnreadCountByReceiverId', () => {
    it('should return count of unread messages for a receiver', async () => {
      // 模拟查询结果
      mockDatabaseClient.query.mockResolvedValue({
        data: [],
        total: 5,
        limit: 0,
        offset: 0
      });
      
      // 调用被测试方法
      const result = await messageRepository.getUnreadCountByReceiverId('user2');
      
      // 验证结果
      expect(result).toBe(5);
      expect(mockDatabaseClient.query).toHaveBeenCalledWith('messages', {
        where: { 
          receiverId: 'user2',
          status: { $ne: 'read' }
        },
        count: true,
        limit: 0
      });
    });
  });
}); 