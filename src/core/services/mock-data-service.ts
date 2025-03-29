import { User, Match, Message } from '@/core/lib/db/types';
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
    
    // Initialize mock user data
    this.users = [
      {
        id: '1',
        name: '张三',
        email: 'zhangsan@example.com',
        bio: '喜欢旅行和摄影',
        photoUrl: 'https://picsum.photos/400/600?random=1',
        interests: ['旅行', '摄影', '美食'],
        birthDate: new Date('1998-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: '李四',
        email: 'lisi@example.com',
        bio: '热爱运动和音乐',
        photoUrl: 'https://picsum.photos/400/600?random=4',
        interests: ['运动', '音乐', '电影'],
        birthDate: new Date('1995-06-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: '王五',
        email: 'wangwu@example.com',
        bio: '喜欢读书和写作',
        photoUrl: 'https://picsum.photos/400/600?random=7',
        interests: ['读书', '写作', '咖啡'],
        birthDate: new Date('2000-12-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Initialize mock match data
    this.matches = [
      {
        id: '1',
        user1Id: '1',
        user2Id: '2',
        isMatched: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        user1Id: '1',
        user2Id: '3',
        isMatched: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Initialize mock message data
    this.messages = [
      {
        id: '1',
        matchId: '1',
        senderId: '1',
        receiverId: '2',
        content: '你好！很高兴认识你！',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        matchId: '1',
        senderId: '2',
        receiverId: '1',
        content: '你好！我也是！',
        isRead: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.isInitialized = true;
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(user: User): Promise<User> {
    const now = new Date();
    const newUser = {
      ...user,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...data,
        updatedAt: new Date()
      };
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }

  // Match operations
  async getMatch(id: string): Promise<Match | null> {
    return this.matches.find(m => m.id === id) || null;
  }

  async getMatches(userId: string): Promise<Match[]> {
    return this.matches.filter(m => m.user1Id === userId || m.user2Id === userId);
  }

  async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    const now = new Date();
    const match: Match = {
      id: Date.now().toString(),
      user1Id,
      user2Id,
      isMatched: false,
      createdAt: now,
      updatedAt: now
    };
    this.matches.push(match);
    return match;
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    const index = this.matches.findIndex(m => m.id === id);
    if (index !== -1) {
      this.matches[index] = {
        ...this.matches[index],
        ...data,
        updatedAt: new Date()
      };
    }
  }

  async deleteMatch(id: string): Promise<void> {
    this.matches = this.matches.filter(m => m.id !== id);
  }

  // Message operations
  async getMessage(id: string): Promise<Message | null> {
    return this.messages.find(m => m.id === id) || null;
  }

  async getMessages(matchId: string): Promise<Message[]> {
    return this.messages.filter(m => m.matchId === matchId);
  }

  async createMessage(message: Message): Promise<Message> {
    const now = new Date();
    const newMessage = {
      ...message,
      createdAt: now,
      updatedAt: now
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    const index = this.messages.findIndex(m => m.id === id);
    if (index !== -1) {
      this.messages[index] = {
        ...this.messages[index],
        ...data,
        updatedAt: new Date()
      };
    }
  }

  async deleteMessage(id: string): Promise<void> {
    this.messages = this.messages.filter(m => m.id !== id);
  }

  // Additional operations
  async getUserMatches(userId: string): Promise<Match[]> {
    return this.matches.filter(m => m.user1Id === userId || m.user2Id === userId);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.messages.filter(m => m.senderId === userId || m.receiverId === userId);
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    return this.messages.filter(m => m.receiverId === userId && !m.isRead);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.updateMessage(messageId, { isRead: true });
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markMessageAsRead(id)));
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