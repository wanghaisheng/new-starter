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

describe('Dating App 用户旅程测试', () => {
  let dataService: MockDataService;
  
  // 测试数据
  const testUsers: User[] = [
    {
      id: 'test-user-1',
      name: '张三',
      email: 'zhangsan@example.com',
      bio: '喜欢旅行和摄影的程序员',
      photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      interests: ['编程', '摄影', '旅行'],
      birthDate: new Date('1995-01-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'test-user-2',
      name: '李四',
      email: 'lisi@example.com',
      bio: '热爱音乐和电影',
      photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
      interests: ['音乐', '电影', '阅读'],
      birthDate: new Date('1992-06-20'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'test-user-3',
      name: '王五',
      email: 'wangwu@example.com',
      bio: '喜欢运动和户外活动',
      photoUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      interests: ['运动', '户外', '烹饪'],
      birthDate: new Date('1990-03-10'),
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

  describe('用户旅程：从发现到匹配到聊天', () => {
    it('完整用户旅程测试', async () => {
      // 步骤1：用户浏览推荐用户
      const users = await dataService.getUsers();
      expect(users.length).toBe(3);
      
      // 模拟当前用户是张三
      const currentUser = users.find(u => u.id === 'test-user-1');
      expect(currentUser).not.toBeNull();
      expect(currentUser?.name).toBe('张三');
      
      // 步骤2：用户对李四右滑（喜欢）
      const targetUser = users.find(u => u.id === 'test-user-2');
      expect(targetUser).not.toBeNull();
      expect(targetUser?.name).toBe('李四');
      
      // 创建匹配（模拟右滑操作）
      const match = await dataService.createMatch('test-user-1', 'test-user-2');
      expect(match).not.toBeNull();
      expect(match.user1Id).toBe('test-user-1');
      expect(match.user2Id).toBe('test-user-2');
      expect(match.isMatched).toBe(false);
      
      // 步骤3：李四也对张三右滑，形成匹配
      await dataService.updateMatch(match.id, { isMatched: true });
      const updatedMatch = await dataService.getMatch(match.id);
      expect(updatedMatch?.isMatched).toBe(true);
      
      // 步骤4：查看匹配列表
      const matches = await dataService.getMatches('test-user-1');
      expect(matches.length).toBe(1);
      expect(matches[0].id).toBe(match.id);
      
      // 步骤5：张三向李四发送消息
      const message1: Message = {
        id: 'test-message-1',
        matchId: match.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '你好，很高兴认识你！',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message1);
      
      // 步骤6：李四查看消息并标记为已读
      const messages1 = await dataService.getMessages(match.id);
      expect(messages1.length).toBe(1);
      expect(messages1[0].content).toBe('你好，很高兴认识你！');
      await dataService.updateMessage('test-message-1', { isRead: true });
      
      // 步骤7：李四回复消息
      const message2: Message = {
        id: 'test-message-2',
        matchId: match.id,
        senderId: 'test-user-2',
        receiverId: 'test-user-1',
        content: '你好！我也很高兴认识你！',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message2);
      
      // 步骤8：张三查看所有消息
      const messages2 = await dataService.getMessages(match.id);
      expect(messages2.length).toBe(2);
      
      // 验证消息顺序和内容
      expect(messages2[0].content).toBe('你好，很高兴认识你！');
      expect(messages2[0].isRead).toBe(true);
      expect(messages2[1].content).toBe('你好！我也很高兴认识你！');
      expect(messages2[1].isRead).toBe(false);
      
      // 步骤9：张三标记李四的消息为已读
      await dataService.updateMessage('test-message-2', { isRead: true });
      const updatedMessage = await dataService.getMessage('test-message-2');
      expect(updatedMessage?.isRead).toBe(true);
    });
  });
  
  describe('匹配系统功能测试', () => {
    it('应该能够正确处理单向喜欢（未匹配）', async () => {
      // 张三喜欢王五，但王五还没有操作
      const match = await dataService.createMatch('test-user-1', 'test-user-3');
      expect(match.isMatched).toBe(false);
      
      // 检查张三的匹配列表
      const matches = await dataService.getMatches('test-user-1');
      expect(matches.length).toBe(1);
      expect(matches[0].isMatched).toBe(false);
    });
    
    it('应该能够正确处理双向喜欢（匹配成功）', async () => {
      // 张三喜欢李四
      const match = await dataService.createMatch('test-user-1', 'test-user-2');
      
      // 李四也喜欢张三，更新匹配状态
      await dataService.updateMatch(match.id, { isMatched: true });
      
      // 检查匹配状态
      const updatedMatch = await dataService.getMatch(match.id);
      expect(updatedMatch?.isMatched).toBe(true);
    });
  });
  
  describe('消息系统功能测试', () => {
    let testMatch: Match;

    beforeEach(async () => {
      // 创建一个已匹配的关系
      testMatch = await dataService.createMatch('test-user-1', 'test-user-2');
      await dataService.updateMatch(testMatch.id, { isMatched: true });
    });

    it('应该能够发送和接收消息', async () => {
      // 张三发送消息
      const message1: Message = {
        id: 'test-message-1',
        matchId: testMatch.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '你好，测试消息',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message1);
      
      // 李四回复消息
      const message2: Message = {
        id: 'test-message-2',
        matchId: testMatch.id,
        senderId: 'test-user-2',
        receiverId: 'test-user-1',
        content: '你好，收到了',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message2);
      
      // 检查消息列表
      const messages = await dataService.getMessages(testMatch.id);
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe('你好，测试消息');
      expect(messages[1].content).toBe('你好，收到了');
    });

    it('应该能够正确处理消息状态', async () => {
      // 发送消息
      const message: Message = {
        id: 'test-message-3',
        matchId: testMatch.id,
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        content: '测试消息状态',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await dataService.createMessage(message);
      
      // 初始状态应为未读
      let msg = await dataService.getMessage('test-message-3');
      expect(msg?.isRead).toBe(false);
      
      // 标记为已读
      await dataService.updateMessage('test-message-3', { isRead: true });
      
      // 检查状态是否更新
      msg = await dataService.getMessage('test-message-3');
      expect(msg?.isRead).toBe(true);
    });
  });
});