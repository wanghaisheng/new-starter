import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { MockDataService } from '@/core/services/mock-data-service';
import { User, Match, Message } from '@/core/lib/db/types';

// 模拟环境变量
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_DATABASE_ENV: 'mock'
  }
}));

describe('Dating App 核心功能测试', () => {
  let dataService: MockDataService;
  
  // 测试数据
  const testUsers: User[] = [
    {
      id: 'test-user-1',
      name: '测试用户1',
      email: 'test1@example.com',
      bio: '测试用户简介1',
      photoUrl: 'https://picsum.photos/400/600?random=1',
      interests: ['旅行', '摄影', '美食'],
      birthDate: new Date('1998-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'test-user-2',
      name: '测试用户2',
      email: 'test2@example.com',
      bio: '测试用户简介2',
      photoUrl: 'https://picsum.photos/400/600?random=2',
      interests: ['运动', '音乐', '电影'],
      birthDate: new Date('1995-06-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'test-user-3',
      name: '测试用户3',
      email: 'test3@example.com',
      bio: '测试用户简介3',
      photoUrl: 'https://picsum.photos/400/600?random=3',
      interests: ['读书', '写作', '咖啡'],
      birthDate: new Date('2000-12-31'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    // 获取数据服务实例
    dataService = DataServiceFactory.getInstance() as MockDataService;
    await dataService.clearAll();
    
    // 初始化测试数据
    for (const user of testUsers) {
      await dataService.createUser(user);
    }
  });

  afterEach(async () => {
    await dataService.clearAll();
  });

  describe('个人资料功能测试', () => {
    it('应该能够获取用户信息', async () => {
      const user = await dataService.getUser('test-user-1');
      expect(user).not.toBeNull();
      expect(user?.name).toBe('测试用户1');
      expect(user?.interests).toContain('旅行');
    });

    it('应该能够更新用户信息', async () => {
      await dataService.updateUser('test-user-1', { bio: '更新后的简介' });
      const user = await dataService.getUser('test-user-1');
      expect(user?.bio).toBe('更新后的简介');
    });

    it('应该能够获取所有用户', async () => {
      const users = await dataService.getUsers();
      expect(users.length).toBe(3);
    });
  });

  describe('匹配系统功能测试', () => {
    it('应该能够创建匹配', async () => {
      const match = await dataService.createMatch('test-user-1', 'test-user-2');
      expect(match).not.toBeNull();
      expect(match.user1Id).toBe('test-user-1');
      expect(match.user2Id).toBe('test-user-2');
      expect(match.isMatched).toBe(false);
    });

    it('应该能够更新匹配状态', async () => {
      const match = await dataService.createMatch('test-user-1', 'test-user-2');
      await dataService.updateMatch(match.id, { isMatched: true });
      const updatedMatch = await dataService.getMatch(match.id);
      expect(updatedMatch?.isMatched).toBe(true);
    });

    it('应该能够获取用户的所有匹配', async () => {
      await dataService.createMatch('test-user-1', 'test-user-2');
      await dataService.createMatch('test-user-1', 'test-user-3');
      const matches = await dataService.getMatches('test-user-1');
      expect(matches.length).toBe(2);
    });
  });

  describe('消息系统功能测试', () => {
    let testMatch: Match;

    beforeEach(async () => {
      testMatch = await dataService.createMatch('test-user-1', 'test-user-2');
      await dataService.updateMatch(testMatch.id, { isMatched: true });
    });

    it('应该能够发送消息', async () => {
      const message: Message = {
        id: 'test-message-1',
        matchId: testMatch.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '你好，测试消息',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      const messages = await dataService.getMessages(testMatch.id);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('你好，测试消息');
    });

    it('应该能够标记消息为已读', async () => {
      const message: Message = {
        id: 'test-message-2',
        matchId: testMatch.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '测试已读状态',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      await dataService.updateMessage('test-message-2', { isRead: true });
      const updatedMessage = await dataService.getMessage('test-message-2');
      expect(updatedMessage?.isRead).toBe(true);
    });

    it('应该能够获取匹配的所有消息', async () => {
      const message1: Message = {
        id: 'test-message-3',
        matchId: testMatch.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '消息1',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const message2: Message = {
        id: 'test-message-4',
        matchId: testMatch.id,
        senderId: 'test-user-2',
        receiverId: 'test-user-1',
        content: '消息2',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message1);
      await dataService.createMessage(message2);
      const messages = await dataService.getMessages(testMatch.id);
      expect(messages.length).toBe(2);
    });
  });
});