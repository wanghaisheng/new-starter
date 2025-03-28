import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';
import { IDataService } from './data-service.interface';

export class MockDataService implements IDataService {
  private static instance: MockDataService;
  private users: User[] = [];
  private matches: Match[] = [];
  private messages: Message[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // 初始化模拟用户数据
    this.users = [
      {
        id: '1',
        name: '张三',
        age: 25,
        bio: '喜欢旅行和摄影',
        images: [
          'https://picsum.photos/400/600?random=1',
          'https://picsum.photos/400/600?random=2',
          'https://picsum.photos/400/600?random=3'
        ],
        interests: ['旅行', '摄影', '美食'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '李四',
        age: 28,
        bio: '热爱运动和音乐',
        images: [
          'https://picsum.photos/400/600?random=4',
          'https://picsum.photos/400/600?random=5',
          'https://picsum.photos/400/600?random=6'
        ],
        interests: ['运动', '音乐', '电影'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '王五',
        age: 23,
        bio: '喜欢读书和写作',
        images: [
          'https://picsum.photos/400/600?random=7',
          'https://picsum.photos/400/600?random=8',
          'https://picsum.photos/400/600?random=9'
        ],
        interests: ['读书', '写作', '咖啡'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 初始化模拟匹配数据
    this.matches = [
      {
        id: '1',
        users: ['1', '2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        users: ['1', '3'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 初始化模拟消息数据
    this.messages = [
      {
        id: '1',
        matchId: '1',
        senderId: '1',
        text: '你好！很高兴认识你！',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        matchId: '1',
        senderId: '2',
        text: '你好！我也是！',
        timestamp: new Date().toISOString(),
        read: true
      }
    ];

    this.isInitialized = true;
  }

  // 用户相关方法
  public async saveUser(user: User): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
  }

  public async getUser(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  public async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  // 匹配相关方法
  public async saveMatch(match: Match): Promise<void> {
    const index = this.matches.findIndex(m => m.id === match.id);
    if (index >= 0) {
      this.matches[index] = match;
    } else {
      this.matches.push(match);
    }
  }

  public async getMatches(): Promise<Match[]> {
    return [...this.matches];
  }

  // 消息相关方法
  public async saveMessage(message: Message): Promise<void> {
    const index = this.messages.findIndex(m => m.id === message.id);
    if (index >= 0) {
      this.messages[index] = message;
    } else {
      this.messages.push(message);
    }
  }

  public async getMessages(): Promise<Message[]> {
    return [...this.messages].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // 清理数据
  public async clearAll(): Promise<void> {
    this.users = [];
    this.matches = [];
    this.messages = [];
    this.isInitialized = false;
    await this.initialize();
  }
} 