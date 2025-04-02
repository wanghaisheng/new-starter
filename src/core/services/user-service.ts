import { User, Match, Message } from '@/core/lib/db/types';
import { NetworkService } from './network-service';
import { DataServiceFactory } from './data-service-factory';
import { IDataService } from './data-service-interface';
import { v4 as uuid } from 'uuid';

/**
 * 用户服务接口
 * 定义用户相关的服务方法
 */
export interface IUserService {
  initialize(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  saveCurrentUser(user: User): Promise<void>;
  getUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  getUserById(userId: string): Promise<User | null>;
  createMatch(userIds: string[]): Promise<Match>;
  deleteMatch(matchId: string): Promise<void>;
  sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<Message>;
}

/**
 * 用户服务
 * 处理用户相关的操作，如获取当前用户、保存用户数据、创建用户等
 */
export class UserService implements IUserService {
  private static instance: UserService;
  private dataService: IDataService;
  private networkService: NetworkService;
  private initialized: boolean = false;
  private currentUserId: string | null = null;

  /**
   * 构造函数
   */
  private constructor() {
    this.dataService = DataServiceFactory.getDataService();
    this.networkService = NetworkService.getInstance();
  }

  /**
   * 获取 UserService 的单例
   * @returns UserService 实例
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 初始化用户服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 确保数据服务已初始化
      await this.dataService.initialize();
      
      // 确保网络服务已初始化
      await this.networkService.initialize();
      
      // 尝试从本地存储加载当前用户ID
      this.currentUserId = localStorage.getItem('currentUserId');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize UserService:', error);
      throw new Error('Failed to initialize UserService');
    }
  }

  /**
   * 获取当前用户
   * @returns 当前用户信息
   */
  public async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    
    if (!this.currentUserId) {
      return null;
    }
    
    try {
      return await this.dataService.getUser(this.currentUserId);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * 保存当前用户
   * @param user 用户数据
   */
  public async saveCurrentUser(user: User): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // 确保用户有ID
      if (!user.id) {
        user.id = uuid();
      }
      
      // 保存或更新用户
      if (this.currentUserId) {
        await this.dataService.updateUser(this.currentUserId, user);
      } else {
        await this.dataService.createUser(user);
      }
      
      // 更新当前用户ID
      this.currentUserId = user.id;
      
      // 保存当前用户ID到本地存储
      localStorage.setItem('currentUserId', user.id);
    } catch (error) {
      console.error('Error saving current user:', error);
      throw new Error('Failed to save current user');
    }
  }

  /**
   * 获取所有用户
   * @returns 用户列表
   */
  public async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    
    try {
      return await this.dataService.getUsers();
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * 保存用户列表
   * @param users 用户列表
   */
  public async saveUsers(users: User[]): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.dataService.bulkCreateUsers(users);
    } catch (error) {
      console.error('Error saving users:', error);
      throw new Error('Failed to save users');
    }
  }

  /**
   * 创建新用户
   * @param user 用户数据
   * @returns 创建的用户
   */
  public async createUser(user: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    
    try {
      // 确保用户有ID
      if (!user.id) {
        user.id = uuid();
      }
      
      // 确保有创建和更新时间
      const now = new Date();
      const newUser: User = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate || now,
        gender: user.gender || 'other',
        photos: user.photos || [],
        bio: user.bio || '',
        interests: user.interests || [],
        location: user.location || {
          latitude: 0,
          longitude: 0,
          city: '',
          country: ''
        },
        preferences: user.preferences || {
          ageRange: { min: 18, max: 99 },
          distance: 100,
          gender: ['male', 'female', 'other'],
          interests: []
        },
        isVerified: user.isVerified || false,
        lastActive: user.lastActive || now,
        status: user.status || 'active',
        googleId: user.googleId || undefined,
        createdAt: now,
        updatedAt: now
      };
      
      return await this.dataService.createUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param updates 更新数据
   * @returns 更新后的用户
   */
  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    
    if (!userId) {
      throw new Error('User ID is required for update');
    }
    
    try {
      const updatedUser = await this.dataService.updateUser(userId, {
        ...updates,
        updatedAt: new Date()
      });
      
      // 如果更新的是当前用户，同步更新currentUserId
      if (userId === this.currentUserId) {
        this.currentUserId = updatedUser.id;
        localStorage.setItem('currentUserId', updatedUser.id);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * 删除用户
   * @param userId 用户ID
   */
  public async deleteUser(userId: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }
    
    try {
      await this.dataService.deleteUser(userId);
      
      // 如果删除的是当前用户，清除currentUserId
      if (userId === this.currentUserId) {
        this.currentUserId = null;
        localStorage.removeItem('currentUserId');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * 根据ID获取用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  public async getUserById(userId: string): Promise<User | null> {
    await this.ensureInitialized();
    
    if (!userId) {
      return null;
    }
    
    try {
      return await this.dataService.getUser(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * 创建匹配
   * @param userIds 用户ID数组
   * @returns 匹配信息
   */
  public async createMatch(userIds: string[]): Promise<Match> {
    await this.ensureInitialized();
    
    if (!userIds || userIds.length !== 2) {
      throw new Error('Exactly two user IDs are required to create a match');
    }
    
    try {
      const now = new Date();
      const newMatch: Match = {
        id: uuid(),
        users: [userIds[0], userIds[1]] as [string, string],
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      
      return await this.dataService.createMatch(newMatch);
    } catch (error) {
      console.error('Error creating match:', error);
      throw new Error('Failed to create match');
    }
  }

  /**
   * 删除匹配
   * @param matchId 匹配ID
   */
  public async deleteMatch(matchId: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!matchId) {
      throw new Error('Match ID is required for deletion');
    }
    
    try {
      // 获取与匹配相关的所有消息
      const messages = await this.dataService.getMessages(matchId);
      
      // 删除所有相关消息
      for (const message of messages) {
        await this.dataService.deleteMessage(message.id);
      }
      
      // 删除匹配
      await this.dataService.deleteMatch(matchId);
    } catch (error) {
      console.error('Error deleting match:', error);
      throw new Error('Failed to delete match');
    }
  }

  /**
   * 发送消息
   * @param matchId 匹配ID
   * @param senderId 发送者ID
   * @param receiverId 接收者ID
   * @param content 消息内容
   * @param type 消息类型
   * @returns 发送的消息
   */
  public async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: string = 'text'
  ): Promise<Message> {
    await this.ensureInitialized();
    
    if (!matchId || !senderId || !receiverId || !content) {
      throw new Error('Match ID, sender ID, receiver ID, and content are required to send a message');
    }
    
    // 验证消息类型
    const validTypes = ['text', 'image'];
    const messageType = validTypes.includes(type) ? (type as 'text' | 'image') : 'text';
    
    try {
      const now = new Date();
      const newMessage: Message = {
        id: uuid(),
        matchId,
        senderId,
        receiverId,
        content,
        type: messageType,
        status: 'sent',
        createdAt: now,
        updatedAt: now
      };
      
      const message = await this.dataService.createMessage(newMessage);
      
      // 更新匹配
      await this.dataService.updateMatch(matchId, {
        updatedAt: now
      });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * 将消息标记为已读
   * @param messageId 消息ID
   * @returns 更新后的消息
   */
  public async markMessageAsRead(messageId: string): Promise<Message> {
    await this.ensureInitialized();
    
    if (!messageId) {
      throw new Error('Message ID is required to mark as read');
    }
    
    try {
      return await this.dataService.updateMessage(messageId, {
        status: 'read',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * 获取用户的匹配列表
   * @param userId 用户ID
   * @returns 匹配列表
   */
  public async getMatches(userId?: string): Promise<Match[]> {
    await this.ensureInitialized();
    
    try {
      return await this.dataService.getMatches(userId);
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}