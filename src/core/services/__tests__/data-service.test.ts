import '@testing-library/jest-dom';
import { MockDataService } from '../mock-data-service';
import { DataServiceFactory } from '../data-service-factory';
import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

describe('DataService Tests', () => {
  let mockService: MockDataService;

  beforeEach(async () => {
    // 初始化 MockDataService
    mockService = MockDataService.getInstance();
    await mockService.initialize();
  });

  afterEach(async () => {
    // 清理数据
    await mockService.clearAll();
  });

  describe('MockDataService Tests', () => {
    test('should initialize with mock data', async () => {
      const users = await mockService.getUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('images');
    });

    test('should save and retrieve user', async () => {
      const newUser: User = {
        id: '4',
        name: '测试用户',
        age: 30,
        bio: '测试简介',
        images: ['https://picsum.photos/400/600?random=10'],
        interests: ['测试'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await mockService.saveUser(newUser);
      const retrievedUser = await mockService.getUser('4');
      expect(retrievedUser).toEqual(newUser);
    });

    test('should save and retrieve match', async () => {
      const newMatch: Match = {
        id: '3',
        users: ['1', '4'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await mockService.saveMatch(newMatch);
      const matches = await mockService.getMatches();
      expect(matches).toContainEqual(newMatch);
    });

    test('should save and retrieve message', async () => {
      const newMessage: Message = {
        id: '3',
        matchId: '1',
        senderId: '1',
        text: '测试消息',
        timestamp: new Date().toISOString(),
        read: false
      };

      await mockService.saveMessage(newMessage);
      const messages = await mockService.getMessages();
      expect(messages).toContainEqual(newMessage);
    });
  });

  describe('DataServiceFactory Tests', () => {
    test('should return MockDataService in development', () => {
      process.env.NEXT_PUBLIC_DATABASE_ENV = 'mock';
      const service = DataServiceFactory.getInstance();
      expect(service).toBeInstanceOf(MockDataService);
    });

    test('should return MockDataService in web environment', () => {
      process.env.NEXT_PUBLIC_DATABASE_ENV = 'local';
      // 模拟 Web 平台
      Object.defineProperty(global, 'Capacitor', {
        value: { isNativePlatform: () => false }
      });
      const service = DataServiceFactory.getInstance();
      expect(service).toBeInstanceOf(MockDataService);
    });
  });
}); 