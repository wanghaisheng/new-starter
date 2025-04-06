import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { MockDataService } from '@/core/services/mock-data-service';
import { User, Match, Message, CreateUserData, CreateMatchData, CreatePhotoData, Photo } from '@/core/lib/db/types';

// 模拟环境变量
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_DATABASE_ENV: 'mock'
  }
}));

describe('Dating App 核心功能测试', () => {
  let dataService: MockDataService;
  
  // 测试数据
  const testUsers: CreateUserData[] = [
    {
      name: '测试用户1',
      email: 'test1@example.com',
      bio: '测试用户简介1',
      birthDate: new Date('1998-01-01'),
      gender: 'male',
      interests: ['旅行', '摄影', '美食'],
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        city: '北京市',
        country: '中国'
      },
      photos: [{
        url: 'https://picsum.photos/400/600?random=1',
        order: 1,
        isMain: true,
        userId: 'test-user-1',
        id: 'photo-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      name: '测试用户2',
      email: 'test2@example.com',
      bio: '测试用户简介2',
      birthDate: new Date('1995-06-15'),
      gender: 'female',
      interests: ['运动', '音乐', '电影'],
      location: {
        latitude: 31.2304,
        longitude: 121.4737,
        city: '上海市',
        country: '中国'
      },
      photos: [{
        url: 'https://picsum.photos/400/600?random=2',
        order: 1,
        isMain: true,
        userId: 'test-user-2',
        id: 'photo-2',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      name: '测试用户3',
      email: 'test3@example.com',
      bio: '测试用户简介3',
      birthDate: new Date('2000-12-31'),
      gender: 'other',
      interests: ['读书', '写作', '咖啡'],
      location: {
        latitude: 23.1291,
        longitude: 113.2644,
        city: '广州市',
        country: '中国'
      },
      photos: [{
        url: 'https://picsum.photos/400/600?random=3',
        order: 1,
        isMain: true,
        userId: 'test-user-3',
        id: 'photo-3',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    }
  ];

  beforeEach(async () => {
    // 获取数据服务实例
    dataService = DataServiceFactory.getInstance() as MockDataService;
    await dataService.clearAll();
    
    // 初始化测试数据
    for (const user of testUsers) {
      await dataService.createUser(user as User);
    }
  });

  afterEach(async () => {
    await dataService.clearAll();
  });

  describe('个人资料功能测试', () => {
    it('应该能够获取用户信息', async () => {
      const users = await dataService.getUsers();
      const user = users[0];
      expect(user).not.toBeNull();
      expect(user?.name).toBe('测试用户1');
      expect(user?.interests).toContain('旅行');
    });

    it('应该能够更新用户信息', async () => {
      const users = await dataService.getUsers();
      const userId = users[0].id;
      await dataService.updateUser(userId, { bio: '更新后的简介' });
      const user = await dataService.getUser(userId);
      expect(user?.bio).toBe('更新后的简介');
    });

    it('应该能够获取所有用户', async () => {
      const users = await dataService.getUsers();
      expect(users.length).toBe(3);
    });

    it('应该能够删除用户', async () => {
      const users = await dataService.getUsers();
      const userId = users[0].id;
      await dataService.deleteUser(userId);
      const user = await dataService.getUser(userId);
      expect(user).toBeNull();
    });

    it('应该能够更新用户兴趣', async () => {
      const users = await dataService.getUsers();
      const userId = users[0].id;
      const newInterests = ['编程', '游戏', '音乐'];
      await dataService.updateUser(userId, { interests: newInterests });
      const user = await dataService.getUser(userId);
      expect(user?.interests).toEqual(newInterests);
    });

    it('应该能够更新用户照片', async () => {
      const users = await dataService.getUsers();
      const userId = users[0].id;
      const newPhoto: Photo = {
        id: 'new-photo-1',
        url: 'https://picsum.photos/400/600?random=999',
        order: 1,
        isMain: true,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.updateUser(userId, { photos: [newPhoto] });
      const user = await dataService.getUser(userId);
      expect(user?.photos[0].url).toBe(newPhoto.url);
    });
  });

  describe('匹配系统功能测试', () => {
    it('应该能够创建匹配', async () => {
      const users = await dataService.getUsers();
      const matchData: CreateMatchData = {
        users: [users[0].id, users[1].id],
        status: 'pending'
      };
      const match = await dataService.createMatch(matchData as Match);
      expect(match).not.toBeNull();
      expect(match.users).toEqual([users[0].id, users[1].id]);
      expect(match.status).toBe('pending');
    });

    it('应该能够更新匹配状态', async () => {
      const users = await dataService.getUsers();
      const matchData: CreateMatchData = {
        users: [users[0].id, users[1].id],
        status: 'pending'
      };
      const match = await dataService.createMatch(matchData as Match);
      await dataService.updateMatch(match.id, { status: 'matched' });
      const updatedMatch = await dataService.getMatch(match.id);
      expect(updatedMatch?.status).toBe('matched');
    });

    it('应该能够获取用户的所有匹配', async () => {
      const users = await dataService.getUsers();
      const matchData1: CreateMatchData = {
        users: [users[0].id, users[1].id],
        status: 'pending'
      };
      const matchData2: CreateMatchData = {
        users: [users[0].id, users[2].id],
        status: 'pending'
      };
      await dataService.createMatch(matchData1 as Match);
      await dataService.createMatch(matchData2 as Match);
      const matches = await dataService.getMatches(users[0].id);
      expect(matches.length).toBe(2);
    });

    it('应该能够删除匹配', async () => {
      const users = await dataService.getUsers();
      const matchData: CreateMatchData = {
        users: [users[0].id, users[1].id],
        status: 'pending'
      };
      const match = await dataService.createMatch(matchData as Match);
      await dataService.deleteMatch(match.id);
      const deletedMatch = await dataService.getMatch(match.id);
      expect(deletedMatch).toBeNull();
    });
  });

  describe('消息系统功能测试', () => {
    let testMatch: Match;

    beforeEach(async () => {
      const users = await dataService.getUsers();
      const matchData: CreateMatchData = {
        users: [users[0].id, users[1].id],
        status: 'matched'
      };
      testMatch = await dataService.createMatch(matchData as Match);
    });

    it('应该能够发送消息', async () => {
      const users = await dataService.getUsers();
      const message: Message = {
        id: 'test-message-1',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '你好，测试消息',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      const messages = await dataService.getMessages(testMatch.id);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('你好，测试消息');
    });

    it('应该能够标记消息为已读', async () => {
      const users = await dataService.getUsers();
      const message: Message = {
        id: 'test-message-2',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '测试已读状态',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      await dataService.updateMessage('test-message-2', { status: 'read' });
      const updatedMessage = await dataService.getMessage('test-message-2');
      expect(updatedMessage?.status).toBe('read');
    });

    it('应该能够获取匹配的所有消息', async () => {
      const users = await dataService.getUsers();
      const message1: Message = {
        id: 'test-message-3',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '消息1',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const message2: Message = {
        id: 'test-message-4',
        matchId: testMatch.id,
        senderId: users[1].id,
        receiverId: users[0].id,
        content: '消息2',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message1);
      await dataService.createMessage(message2);
      const messages = await dataService.getMessages(testMatch.id);
      expect(messages.length).toBe(2);
    });

    it('应该能够删除消息', async () => {
      const users = await dataService.getUsers();
      const message: Message = {
        id: 'test-message-5',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '测试删除消息',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      await dataService.deleteMessage(message.id);
      const deletedMessage = await dataService.getMessage(message.id);
      expect(deletedMessage).toBeNull();
    });

    it('应该能够获取未读消息数量', async () => {
      const users = await dataService.getUsers();
      const message1: Message = {
        id: 'test-message-6',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '未读消息1',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const message2: Message = {
        id: 'test-message-7',
        matchId: testMatch.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '未读消息2',
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message1);
      await dataService.createMessage(message2);
      const unreadCount = await dataService.getUnreadMessages(users[1].id);
      expect(unreadCount).toBe(2);
    });
  });
});