import { User } from '@/core/lib/db/models/user';
import { Match } from '@/core/lib/db/models/match';
import { Message } from '@/core/lib/db/models/message';
import { UserService } from './user-service';
import { StorageService } from './storage-service';
import { NetworkService } from './network-service';
import { MessageService } from './message-service';
import { NetworkStatus } from '@capacitor/network';

/**
 * 数据预加载服务配置
 */
interface DataPreloadConfig {
  /** 是否启用预加载 */
  enabled: boolean;
  /** 预加载的匹配数量限制 */
  maxMatches: number;
  /** 每个匹配预加载的消息数量限制 */
  maxMessagesPerMatch: number;
  /** 预加载的用户数量限制 */
  maxUsers: number;
  /** 自动预加载间隔（毫秒），0表示禁用自动预加载 */
  autoPreloadInterval: number;
  /** 缓存有效期（毫秒） */
  cacheTTL: number;
  /** 缓存存储键前缀 */
  cacheKeyPrefix: string;
}

/**
 * 缓存条目类型
 */
interface CacheEntry<T> {
  /** 缓存数据 */
  data: T;
  /** 过期时间 */
  expiresAt: number;
}

/**
 * 数据预加载服务
 * 
 * 管理应用程序数据的预加载和缓存策略，提高数据加载性能
 * - 支持用户、匹配和消息数据的预加载
 * - 实现本地缓存管理
 * - 提供智能预加载策略
 */
export class DataPreloadService {
  private static instance: DataPreloadService;
  private userService: UserService;
  private storageService: StorageService;
  private networkService: NetworkService;
  
  /** 内存缓存 */
  private cache: Map<string, CacheEntry<any>> = new Map();
  /** 是否正在执行预加载 */
  private isPreloading: boolean = false;
  /** 自动预加载定时器ID */
  private autoPreloadTimer: NodeJS.Timeout | null = null;
  /** 上次网络状态 */
  private _lastOnlineState: boolean = false;

  /** 默认配置 */
  private config: DataPreloadConfig = {
    enabled: true,
    maxMatches: 20,
    maxMessagesPerMatch: 50,
    maxUsers: 50,
    autoPreloadInterval: 5 * 60 * 1000, // 5分钟
    cacheTTL: 15 * 60 * 1000, // 15分钟
    cacheKeyPrefix: 'preload_'
  };
  
  private constructor() {
    this.userService = UserService.getInstance();
    this.storageService = StorageService.getInstance();
    this.networkService = NetworkService.getInstance();
    
    // 监听网络状态变化
    this.networkService.addNetworkStatusListener(this.handleNetworkStatusChange);
    
    // 初始化自动预加载
    this.setupAutoPreload();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): DataPreloadService {
    if (!DataPreloadService.instance) {
      DataPreloadService.instance = new DataPreloadService();
    }
    return DataPreloadService.instance;
  }
  
  /**
   * 设置配置选项
   * @param config 配置选项
   */
  public setConfig(config: Partial<DataPreloadConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 重置自动预加载定时器
    this.setupAutoPreload();
  }
  
  /**
   * 设置自动预加载定时器
   */
  private setupAutoPreload(): void {
    // 清除现有定时器
    if (this.autoPreloadTimer) {
      clearInterval(this.autoPreloadTimer);
      this.autoPreloadTimer = null;
    }
    
    // 如果启用了自动预加载，设置新定时器
    if (this.config.enabled && this.config.autoPreloadInterval > 0) {
      this.autoPreloadTimer = setInterval(() => {
        this.preloadEssentialData();
      }, this.config.autoPreloadInterval);
    }
  }
  
  /**
   * 处理网络状态变化
   * 网络恢复连接时尝试预加载数据
   * 
   * @param status 网络状态
   */
  private handleNetworkStatusChange = (status: NetworkStatus): void => {
    const isOnline = status.connected;
    
    // 如果网络刚恢复连接，尝试预加载数据
    if (isOnline && !this._lastOnlineState) {
      console.log('Network reconnected, attempting to preload essential data');
      this.preloadEssentialData().catch(err => {
        console.error('Failed to preload data after reconnection:', err);
      });
    }
    
    this._lastOnlineState = isOnline;
  };
  
  /**
   * 预加载核心数据
   * 包括当前用户资料、最近匹配和消息
   */
  public async preloadEssentialData(): Promise<void> {
    if (this.isPreloading || !this.config.enabled || !this.networkService.isOnline()) {
      return;
    }
    
    try {
      this.isPreloading = true;
      console.log('[DataPreload] 开始预加载核心数据...');
      
      // 预加载当前用户资料
      const currentUser = await this.userService.getCurrentUser();
      if (currentUser) {
        this.setCache('currentUser', currentUser);
        
        // 预加载最近匹配
        await this.preloadRecentMatches(currentUser.id);
      }
      
      console.log('[DataPreload] 核心数据预加载完成');
    } catch (error) {
      console.error('[DataPreload] 预加载数据失败:', error);
    } finally {
      this.isPreloading = false;
    }
  }
  
  /**
   * 预加载最近匹配
   * @param userId 用户ID
   */
  public async preloadRecentMatches(userId: string): Promise<void> {
    try {
      // 获取最近的匹配
      const matches = await this.userService.getMatches(userId, { 
        limit: this.config.maxMatches, 
        orderBy: 'lastMessageAt' 
      });
      
      this.setCache(`matches_${userId}`, matches);
      
      // 预加载匹配的用户资料
      const matchedUserIds = matches.reduce<string[]>((ids, match) => {
        // 获取匹配中的另一个用户ID
        const otherUserId = match.users.find(id => id !== userId);
        if (otherUserId && !ids.includes(otherUserId)) {
          ids.push(otherUserId);
        }
        return ids;
      }, []);
      
      // 批量预加载用户资料
      if (matchedUserIds.length > 0) {
        const users = await this.userService.getUsersByIds(matchedUserIds);
        users.forEach(user => {
          this.setCache(`user_${user.id}`, user);
        });
      }
      
      // 预加载每个匹配的最近消息
      for (const match of matches) {
        await this.preloadMessagesForMatch(match.id);
      }
    } catch (error) {
      console.error('[DataPreload] 预加载匹配数据失败:', error);
    }
  }
  
  /**
   * 预加载特定匹配的消息
   * 
   * @param matchId 匹配ID
   */
  public async preloadMessagesForMatch(matchId: string): Promise<void> {
    try {
      const messageService = MessageService.getInstance();
      const messages = await messageService.getMessages(matchId, { 
        limit: this.config.maxMessagesPerMatch,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Preloaded ${messages.length} messages for match ${matchId}`);
      this.setCache(`messages_${matchId}`, messages);
    } catch (error) {
      console.error(`Failed to preload messages for match ${matchId}:`, error);
    }
  }
  
  /**
   * 预加载推荐用户数据
   */
  public async preloadRecommendedUsers(): Promise<void> {
    try {
      const recommendations = await this.userService.getRecommendedUsers({ 
        limit: this.config.maxUsers 
      });
      
      this.setCache('recommendedUsers', recommendations);
      
      // 缓存每个推荐用户的详细资料
      recommendations.forEach(user => {
        this.setCache(`user_${user.id}`, user);
      });
    } catch (error) {
      console.error('[DataPreload] 预加载推荐用户数据失败:', error);
    }
  }
  
  /**
   * 从缓存获取数据
   * @param key 缓存键
   * @returns 缓存的数据或undefined
   */
  public getCache<T>(key: string): T | undefined {
    const fullKey = `${this.config.cacheKeyPrefix}${key}`;
    
    // 首先检查内存缓存
    const memoryCache = this.cache.get(fullKey);
    if (memoryCache && memoryCache.expiresAt > Date.now()) {
      return memoryCache.data as T;
    }
    
    // 如果内存缓存不存在或已过期，检查本地存储
    try {
      const storageData = this.storageService.getItem<CacheEntry<T>>(fullKey);
      
      if (storageData && storageData.expiresAt > Date.now()) {
        // 刷新内存缓存
        this.cache.set(fullKey, storageData);
        return storageData.data;
      }
    } catch (error) {
      console.warn(`[DataPreload] 从存储获取缓存 ${key} 失败:`, error);
    }
    
    // 缓存不存在或已过期
    return undefined;
  }
  
  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 缓存有效期（毫秒），默认使用配置中的值
   */
  public setCache<T>(key: string, data: T, ttl?: number): void {
    const fullKey = `${this.config.cacheKeyPrefix}${key}`;
    const expiresAt = Date.now() + (ttl || this.config.cacheTTL);
    
    const cacheEntry: CacheEntry<T> = {
      data,
      expiresAt
    };
    
    // 更新内存缓存
    this.cache.set(fullKey, cacheEntry);
    
    // 更新本地存储缓存
    try {
      this.storageService.setItem(fullKey, cacheEntry);
    } catch (error) {
      console.warn(`[DataPreload] 保存缓存 ${key} 到存储失败:`, error);
    }
  }
  
  /**
   * 清除指定的缓存
   * @param key 缓存键
   */
  public clearCache(key: string): void {
    const fullKey = `${this.config.cacheKeyPrefix}${key}`;
    
    // 清除内存缓存
    this.cache.delete(fullKey);
    
    // 清除本地存储缓存
    try {
      this.storageService.removeItem(fullKey);
    } catch (error) {
      console.warn(`[DataPreload] 从存储删除缓存 ${key} 失败:`, error);
    }
  }
  
  /**
   * 清除所有缓存
   */
  public clearAllCache(): void {
    // 清除内存缓存
    this.cache.clear();
    
    // 清除本地存储缓存
    try {
      const keys = this.storageService.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.config.cacheKeyPrefix));
      
      cacheKeys.forEach(key => {
        this.storageService.removeItem(key);
      });
    } catch (error) {
      console.error('[DataPreload] 清除所有缓存失败:', error);
    }
  }
  
  /**
   * 预热缓存
   * 加载用户最常访问的数据到缓存
   */
  public async warmupCache(): Promise<void> {
    await Promise.all([
      this.preloadEssentialData(),
      this.preloadRecommendedUsers()
    ]);
  }
} 