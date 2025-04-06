import { v4 as uuid } from 'uuid';

import { User, Match, Message } from '@/core/lib/db/types';

import { DataServiceFactory } from './data-service-factory';
import { IDataService } from './data-service-interface';
import { NetworkService } from './network-service';

/**
 * 离线资料更新项
 */
interface OfflineProfileUpdate {
  userId: string;
  data: Partial<User>;
  timestamp: Date;
}

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
  updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }>;
  syncOfflineProfileUpdates(): Promise<number>;
  deleteUser(userId: string): Promise<void>;
  getUserById(userId: string): Promise<User | null>;
  getUsersByIds(userIds: string[]): Promise<User[]>;
  createMatch(userIds: string[]): Promise<Match>;
  getMatches(userId: string, options?: any): Promise<Match[]>;
  deleteMatch(matchId: string): Promise<void>;
  getRecommendedUsers(options?: any): Promise<User[]>;
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
  private offlineProfileUpdates: OfflineProfileUpdate[] = [];
  private offlineStorageKey: string = 'offline_profile_updates';

  /**
   * 构造函数
   */
  private constructor() {
    this.dataService = DataServiceFactory.getDataService();
    this.networkService = NetworkService.getInstance();
    
    // 加载离线资料更新
    this.loadOfflineProfileUpdates();
    
    // 监听网络状态变化
    this.networkService.addNetworkStatusListener((status) => {
      const isOnline = status.connected;
      if (isOnline && this.offlineProfileUpdates.length > 0) {
        this.syncOfflineProfileUpdates();
      }
    });
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
      return await this.dataService.getUserById(this.currentUserId);
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
        privacySettings: user.privacySettings || {
          showProfileToEveryone: true,
          showOnlineStatus: true,
          showLastActive: true,
          showInDiscovery: true,
          showDistance: true,
          allowDataCollection: true,
          allowPersonalizedAds: true,
          showEmailToMatches: false,
          showPhoneToMatches: false,
          allowProfileSharing: true
        },
        preferences: user.preferences || {
          ageRange: { min: 18, max: 99 },
          distance: 100,
          gender: ['male', 'female', 'other'],
          interests: []
        },
        notificationSettings: user.notificationSettings || {
          newMatches: true,
          matchMessages: true,
          profileViews: true,
          profileLikes: true,
          appUpdates: true,
          promotions: true
        },
        matching: user.matching || {
          completedTests: [],
          testWeights: {},
          testResults: {}
        },
        isVerified: user.isVerified || false,
        lastActive: now,
        isOnline: false,
        status: 'active',
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
   * 更新用户资料，支持离线更新
   * @param userId 用户ID
   * @param updates 资料更新内容
   * @returns 更新结果
   */
  public async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    await this.ensureInitialized();
    
    try {
      // 检查网络连接
      if (this.networkService.isOnline()) {
        // 在线状态下直接更新
        await this.dataService.updateUser(userId, updates);
        return { success: true };
      } else {
        // 离线状态下保存更新
        console.log('Device is offline, saving profile update to offline queue');
        this.addOfflineProfileUpdate(userId, updates);
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // 如果更新失败但可能是网络问题，保存到离线队列
      if (!this.networkService.isOnline()) {
        this.addOfflineProfileUpdate(userId, updates);
        return { success: true, errors: ['Operation saved for later synchronization'] };
      }
      
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : String(error)] 
      };
    }
  }
  
  /**
   * 添加离线资料更新到队列
   * @param userId 用户ID
   * @param data 更新数据
   */
  private addOfflineProfileUpdate(userId: string, data: Partial<User>): void {
    // 创建新的离线更新
    const update: OfflineProfileUpdate = {
      userId,
      data,
      timestamp: new Date()
    };
    
    // 添加到队列
    this.offlineProfileUpdates.push(update);
    
    // 持久化到本地存储
    this.persistOfflineProfileUpdates();
    
    console.log(`Added offline profile update for user ${userId}`);
  }
  
  /**
   * 同步离线资料更新
   * @returns 成功同步的更新数量
   */
  public async syncOfflineProfileUpdates(): Promise<number> {
    await this.ensureInitialized();
    
    // 检查网络连接
    if (!this.networkService.isOnline()) {
      console.log('Cannot sync offline profile updates: device is offline');
      return 0;
    }
    
    if (this.offlineProfileUpdates.length === 0) {
      return 0;
    }
    
    console.log(`Syncing ${this.offlineProfileUpdates.length} offline profile updates`);
    
    // 同步计数
    let syncedCount = 0;
    const failedUpdates: OfflineProfileUpdate[] = [];
    
    // 通知网络服务开始同步
    this.networkService.updateSyncStatus('syncing', {
      pending: this.offlineProfileUpdates.length,
      completed: 0,
      failed: 0
    });
    
    // 创建副本以避免遍历过程中修改数组
    const updatesToSync = [...this.offlineProfileUpdates];
    
    // 逐一应用更新
    for (const update of updatesToSync) {
      try {
        // 对同一用户的多次更新合并为一次
        const userUpdates = updatesToSync
          .filter(u => u.userId === update.userId)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // 合并所有更新
        const mergedUpdate = userUpdates.reduce((merged, current) => {
          return { ...merged, ...current.data };
        }, {});
        
        // 应用更新
        await this.dataService.updateUser(update.userId, mergedUpdate);
        
        // 记录同步成功的更新
        userUpdates.forEach(() => {
          syncedCount++;
        });
        
        // 从队列中移除所有该用户的更新
        this.offlineProfileUpdates = this.offlineProfileUpdates.filter(
          u => u.userId !== update.userId
        );
        
        // 更新同步状态
        this.networkService.updateSyncStatus('syncing', {
          pending: this.offlineProfileUpdates.length,
          completed: syncedCount,
          failed: failedUpdates.length
        });
        
        // 跳过已处理的更新
        continue;
      } catch (error) {
        console.error(`Failed to sync profile update for user ${update.userId}:`, error);
        failedUpdates.push(update);
        
        // 更新同步状态以显示失败
        this.networkService.updateSyncStatus('error', {
          pending: this.offlineProfileUpdates.length - failedUpdates.length,
          completed: syncedCount,
          failed: failedUpdates.length
        });
      }
    }
    
    // 更新离线队列
    this.offlineProfileUpdates = failedUpdates;
    
    // 持久化更新后的队列
    this.persistOfflineProfileUpdates();
    
    // 更新最终同步状态
    if (syncedCount > 0) {
      if (failedUpdates.length === 0) {
        this.networkService.updateSyncStatus('synced');
      } else {
        this.networkService.updateSyncStatus('error', {
          pending: 0,
          completed: syncedCount,
          failed: failedUpdates.length
        });
      }
    }
    
    return syncedCount;
  }
  
  /**
   * 将离线资料更新持久化到本地存储
   */
  private persistOfflineProfileUpdates(): void {
    try {
      // 将更新转换为可序列化的格式
      const serializable = this.offlineProfileUpdates.map(update => ({
        ...update,
        timestamp: update.timestamp.toISOString()
      }));
      
      // 保存到本地存储
      localStorage.setItem(this.offlineStorageKey, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to persist offline profile updates:', error);
    }
  }
  
  /**
   * 从本地存储加载离线资料更新
   */
  private loadOfflineProfileUpdates(): void {
    try {
      // 从本地存储获取数据
      const stored = localStorage.getItem(this.offlineStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 转换日期字符串为Date对象
        this.offlineProfileUpdates = parsed.map((update: any) => ({
          ...update,
          timestamp: new Date(update.timestamp)
        }));
        
        console.log(`Loaded ${this.offlineProfileUpdates.length} offline profile updates`);
      }
    } catch (error) {
      console.error('Failed to load offline profile updates from storage:', error);
    }
  }
  
  /**
   * 计算年龄
   * @param birthDate 出生日期
   * @returns 年龄
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
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
      return await this.dataService.getUserById(userId);
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
   * @param options 查询选项，如限制数量和排序
   * @returns 匹配列表
   */
  public async getMatches(userId: string, options?: { limit?: number; orderBy?: string | Record<string, 'asc' | 'desc'> }): Promise<Match[]> {
    await this.ensureInitialized();
    
    try {
      // 使用基础方法获取匹配
      const matches = await this.dataService.getMatches(userId);
      
      // 应用排序
      if (options?.orderBy) {
        if (typeof options.orderBy === 'string') {
          // 简单排序，例如按 'lastMessageAt'
          matches.sort((a, b) => {
            const aValue = a[options.orderBy as keyof Match];
            const bValue = b[options.orderBy as keyof Match];
            
            if (aValue instanceof Date && bValue instanceof Date) {
              return bValue.getTime() - aValue.getTime(); // 默认降序
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return bValue.localeCompare(aValue); // 默认降序
            }
            
            return 0;
          });
        } else {
          // 复杂排序，例如 { createdAt: 'desc' }
          const field = Object.keys(options.orderBy)[0] as keyof Match;
          const direction = options.orderBy[field];
          
          matches.sort((a, b) => {
            const aValue = a[field];
            const bValue = b[field];
            
            if (aValue instanceof Date && bValue instanceof Date) {
              return direction === 'asc' 
                ? aValue.getTime() - bValue.getTime()
                : bValue.getTime() - aValue.getTime();
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }
            
            return 0;
          });
        }
      }
      
      // 应用限制
      if (options?.limit && options.limit > 0 && matches.length > options.limit) {
        return matches.slice(0, options.limit);
      }
      
      return matches;
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }
  
  /**
   * 根据ID列表获取多个用户资料
   * 
   * @param userIds 用户ID列表
   * @returns 用户资料列表
   */
  public async getUsersByIds(userIds: string[]): Promise<User[]> {
    await this.ensureInitialized();
    
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    try {
      // 使用批量查询替代循环查询
      return await this.dataService.getUsersByIds(userIds);
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      return [];
    }
  }
  
  /**
   * 获取推荐用户列表
   * 
   * @param options 查询选项
   * @returns 推荐用户列表
   */
  public async getRecommendedUsers(options?: { limit?: number }): Promise<User[]> {
    await this.ensureInitialized();
    
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return [];
      }
      
      // 查询数据库中的用户
      const allUsers = await this.dataService.getUsers();
      
      // 筛选出符合当前用户偏好的用户
      let recommendations = allUsers.filter(user => {
        // 排除当前用户
        if (user.id === currentUser.id) {
          return false;
        }
        
        // 根据性别偏好筛选
        if (currentUser.preferences.gender && 
            !currentUser.preferences.gender.includes(user.gender)) {
          return false;
        }
        
        // 年龄筛选
        const userAge = this.calculateAge(user.birthDate);
        if (userAge < currentUser.preferences.ageRange.min || 
            userAge > currentUser.preferences.ageRange.max) {
          return false;
        }
        
        // TODO: 增加更多筛选逻辑（距离、兴趣等）
        
        return true;
      });
      
      // 应用限制
      if (options?.limit && options.limit > 0) {
        recommendations = recommendations.slice(0, options.limit);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommended users:', error);
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