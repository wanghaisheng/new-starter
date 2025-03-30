import { BaseClient } from '../base-client';
import { User, Match, Message } from '../../models';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * 模拟数据库客户端
 * 用于测试和开发环境，提供内存数据存储
 */
export class MockDatabaseClient extends BaseClient implements IDatabaseClient {
  private data: {
    users: Map<string, User>;
    matches: Map<string, Match>;
    messages: Map<string, Message>;
  } = {
    users: new Map(),
    matches: new Map(),
    messages: new Map(),
  };

  constructor(private config: DatabaseConfig) {
    super();
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private async initializeMockData() {
    try {
      // 尝试从预设数据加载
      const mockData = await import('./data/dating-data.json')
        .catch(() => {
          console.log('No preset mock data found, using default mock data');
          return null;
        });

      if (mockData) {
        // 加载预设用户数据
        if (mockData.users) {
          mockData.users.forEach((userData: any) => {
            const user = new User(userData);
            this.data.users.set(user.id, user);
          });
        }

        // 加载预设匹配数据
        if (mockData.matches) {
          mockData.matches.forEach((matchData: any) => {
            const match = new Match(matchData);
            this.data.matches.set(match.id, match);
          });
        }

        // 加载预设消息数据
        if (mockData.messages) {
          mockData.messages.forEach((messageData: any) => {
            const message = new Message(messageData);
            this.data.messages.set(message.id, message);
          });
        }
      } else {
        // 使用默认测试数据
        this.createDefaultMockData();
      }

      console.log(`Mock database initialized with ${this.data.users.size} users, ${this.data.matches.size} matches, ${this.data.messages.size} messages`);
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
      // 出错时使用默认测试数据
      this.createDefaultMockData();
    }
  }

  /**
   * 创建默认测试数据
   */
  private createDefaultMockData() {
    // 创建测试用户
    const testUsers = [
      new User({
        id: uuidv4(),
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800000001',
        birthDate: new Date(1995, 0, 15),
        gender: 'male',
        bio: '喜欢旅行和摄影的程序员',
        interests: ['编程', '摄影', '旅行'],
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          city: '北京',
          country: '中国'
        },
        preferences: {
          ageRange: { min: 20, max: 30 },
          distance: 50,
          gender: ['female'],
          interests: ['音乐', '电影', '阅读']
        },
        isVerified: true,
        lastActive: new Date(),
        status: 'active',
        photos: [
          {
            id: uuidv4(),
            userId: '',
            url: 'https://randomuser.me/api/portraits/men/1.jpg',
            order: 0,
            isMain: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      new User({
        id: uuidv4(),
        name: '李四',
        email: 'lisi@example.com',
        phone: '13800000002',
        birthDate: new Date(1992, 5, 20),
        gender: 'female',
        bio: '热爱音乐和电影',
        interests: ['音乐', '电影', '阅读'],
        location: {
          latitude: 31.2304,
          longitude: 121.4737,
          city: '上海',
          country: '中国'
        },
        preferences: {
          ageRange: { min: 25, max: 35 },
          distance: 30,
          gender: ['male'],
          interests: ['旅行', '摄影', '美食']
        },
        isVerified: true,
        lastActive: new Date(),
        status: 'active',
        photos: [
          {
            id: uuidv4(),
            userId: '',
            url: 'https://randomuser.me/api/portraits/women/2.jpg',
            order: 0,
            isMain: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ];

    // 设置用户ID关联
    testUsers.forEach(user => {
      user.photos.forEach(photo => {
        photo.userId = user.id;
      });
      this.data.users.set(user.id, user);
    });

    // 创建测试匹配
    if (testUsers.length >= 2) {
      const match = new Match({
        id: uuidv4(),
        users: [testUsers[0].id, testUsers[1].id],
        status: 'matched',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      this.data.matches.set(match.id, match);

      // 创建测试消息
      const message1 = new Message({
        id: uuidv4(),
        matchId: match.id,
        senderId: testUsers[0].id,
        receiverId: testUsers[1].id,
        content: '你好，很高兴认识你！',
        contentType: 'text',
        status: 'read',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000)
      });

      const message2 = new Message({
        id: uuidv4(),
        matchId: match.id,
        senderId: testUsers[1].id,
        receiverId: testUsers[0].id,
        content: '你好，我也很高兴认识你！',
        contentType: 'text',
        status: 'delivered',
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(Date.now() - 1800000)
      });

      this.data.messages.set(message1.id, message1);
      this.data.messages.set(message2.id, message2);
    }
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // Mock客户端已在构造函数中初始化
    return Promise.resolve();
  }

  /**
   * 清空数据库
   */
  async clear(): Promise<void> {
    this.data.users.clear();
    this.data.matches.clear();
    this.data.messages.clear();
    return Promise.resolve();
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // Mock客户端不需要关闭连接
    return Promise.resolve();
  }

  // 用户相关操作
  async getUser(id: string): Promise<User | null> {
    return this.data.users.get(id) || null;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.data.users.values());
  }

  async createUser(user: User): Promise<User> {
    if (!user.id) {
      user.id = uuidv4();
    }
    this.data.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const user = this.data.users.get(id);
    if (!user) return null;

    const updatedUser = new User({
      ...user,
      ...userData,
      updatedAt: new Date()
    });

    this.data.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.data.users.delete(id);
  }

  // 匹配相关操作
  async getMatch(id: string): Promise<Match | null> {
    return this.data.matches.get(id) || null;
  }

  async getMatches(): Promise<Match[]> {
    return Array.from(this.data.matches.values());
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    return Array.from(this.data.matches.values())
      .filter(match => match.users.includes(userId));
  }

  async createMatch(match: Match): Promise<Match> {
    if (!match.id) {
      match.id = uuidv4();
    }
    this.data.matches.set(match.id, match);
    return match;
  }

  async updateMatch(id: string, matchData: Partial<Match>): Promise<Match | null> {
    const match = this.data.matches.get(id);
    if (!match) return null;

    const updatedMatch = new Match({
      ...match,
      ...matchData,
      updatedAt: new Date()
    });

    this.data.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: string): Promise<boolean> {
    return this.data.matches.delete(id);
  }

  // 消息相关操作
  async getMessage(id: string): Promise<Message | null> {
    return this.data.messages.get(id) || null;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.data.messages.values());
  }

  async getMatchMessages(matchId: string): Promise<Message[]> {
    return Array.from(this.data.messages.values())
      .filter(message => message.matchId === matchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: Message): Promise<Message> {
    if (!message.id) {
      message.id = uuidv4();
    }
    this.data.messages.set(message.id, message);
    return message;
  }

  async updateMessage(id: string, messageData: Partial<Message>): Promise<Message | null> {
    const message = this.data.messages.get(id);
    if (!message) return null;

    const updatedMessage = new Message({
      ...message,
      ...messageData,
      updatedAt: new Date()
    });

    this.data.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.data.messages.delete(id);
  }
}