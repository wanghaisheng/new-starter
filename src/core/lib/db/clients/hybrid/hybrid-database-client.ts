import { IDatabaseClient, HybridDatabaseConfig, SyncStrategy } from '../../interfaces';
import { User, Match, Message } from '../../types';
import { NetworkService } from '@/core/services/network-service';
import { BaseSyncClient } from '../sync/base-sync-client';

type EntityWithId = { id: string } & Record<string, any>;

/**
 * 混合数据库客户端，支持离线和在线存储
 */
export class HybridDatabaseClient extends BaseSyncClient implements IDatabaseClient {
  protected localClient: IDatabaseClient;
  protected remoteClient: IDatabaseClient;
  protected syncStrategy: SyncStrategy;
  private initialized: boolean = false;
  protected isOnline: boolean = true;
  protected pendingSync: Map<string, EntityWithId[]> = new Map();
  protected syncInProgress: boolean = false;
  protected syncInterval: NodeJS.Timeout | null = null;

  constructor(config: HybridDatabaseConfig) {
    super(config);
    this.localClient = config.localClient;
    this.remoteClient = config.remoteClient;
    this.syncStrategy = config.syncStrategy;
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    // 设置定期同步
    this.setupPeriodicSync(config.syncIntervalMs || 60000); // 默认每分钟同步一次
  }

  protected setupNetworkListener(): void {
    // 使用网络服务监听网络状态变化
    const networkService = NetworkService.getInstance();
    networkService.onNetworkStatusChange((status) => {
      const wasOffline = !this.isOnline;
      this.isOnline = status.connected;
      
      // 如果从离线变为在线，尝试同步待处理的操作
      if (wasOffline && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  protected setupPeriodicSync(intervalMs: number): void {
    // 清除现有的同步间隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 设置新的同步间隔
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.pendingSync.size > 0) {
        this.syncPendingOperations();
      }
    }, intervalMs);
  }

  protected async syncPendingOperations(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress || this.pendingSync.size === 0) return false;
    
    this.syncInProgress = true;
    let success = true;
    
    try {
      // 同步所有待处理的操作
      for (const [collection, items] of Array.from(this.pendingSync.entries())) {
        const failedItems: any[] = [];
        
        for (const item of items) {
          try {
            // 根据不同的集合类型执行不同的同步操作
            switch (collection) {
              case 'users':
                await this.remoteClient.saveEntity('users', item as User);
                break;
              case 'matches':
                await this.remoteClient.saveEntity('matches', item as Match);
                break;
              case 'messages':
                await this.remoteClient.saveEntity('messages', item as Message);
                break;
              case 'deletedUsers':
                await this.remoteClient.deleteEntity('users', item.id);
                break;
              case 'deletedMatches':
                await this.remoteClient.deleteEntity('matches', item.id);
                break;
              case 'deletedMessages':
                await this.remoteClient.deleteEntity('messages', item.id);
                break;
              default:
                console.warn(`未知的集合类型: ${collection}`);
                break;
            }
          } catch (error) {
            console.error(`同步操作失败: ${collection}`, error);
            failedItems.push(item);
            success = false;
          }
        }
        
        // 更新待处理列表，只保留失败的项目
        if (failedItems.length > 0) {
          this.pendingSync.set(collection, failedItems);
        } else {
          this.pendingSync.delete(collection);
        }
      }
    } catch (error) {
      console.error('同步操作过程中发生错误', error);
      success = false;
    } finally {
      this.syncInProgress = false;
    }
    
    return success;
  }

  protected async syncCollectionItems(collection: string, items: any[]): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const failedItems: any[] = [];
      
      for (const item of items) {
        try {
          switch (collection) {
            case 'users':
              await this.remoteClient.saveEntity('users', item as User);
              break;
            case 'matches':
              await this.remoteClient.saveEntity('matches', item as Match);
              break;
            case 'messages':
              await this.remoteClient.saveEntity('messages', item as Message);
              break;
            case 'deletedUsers':
              await this.remoteClient.deleteEntity('users', item.id);
              break;
            case 'deletedMatches':
              await this.remoteClient.deleteEntity('matches', item.id);
              break;
            case 'deletedMessages':
              await this.remoteClient.deleteEntity('messages', item.id);
              break;
            default:
              console.warn(`未知的集合类型: ${collection}`);
              break;
          }
        } catch (error) {
          console.error(`同步操作失败: ${collection}`, error);
          failedItems.push(item);
        }
      }
      
      if (failedItems.length > 0) {
        this.pendingSync.set(collection, failedItems);
      } else {
        this.pendingSync.delete(collection);
      }
    } catch (error) {
      console.error(`同步集合失败: ${collection}`, error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async initialize(): Promise<void> {
    // 初始化本地客户端
    await this.localClient.initialize();
    
    // 如果在线，初始化远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.initialize();
      } catch (error) {
        console.error('远程客户端初始化失败', error);
      }
    }
  }

  async close(): Promise<void> {
    // 清除同步间隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // 如果有待处理的操作，尝试最后一次同步
    if (this.isOnline && this.pendingSync.size > 0) {
      await this.syncPendingOperations();
    }
    
    // 关闭本地客户端
    await this.localClient.close();
    
    // 如果在线，关闭远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.close();
      } catch (error) {
        console.error('远程客户端关闭失败', error);
      }
    }
  }

  async clear(): Promise<void> {
    // 清空本地客户端
    await this.localClient.clear();
    
    // 如果在线，清空远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.clear();
      } catch (error) {
        console.error('远程客户端清空失败', error);
      }
    }
    
    // 清空待同步操作
    this.pendingSync.clear();
  }

  // 移除特定表相关的方法，使用通用实体方法替代

  // 用户相关操作 - 使用通用实体方法
  async saveUser(user: User): Promise<void> {
    await this.saveEntity('users', user);
  }

  async getUser(id: string): Promise<User | null> {
    return this.getEntity<User>('users', id);
  }

  async getUsers(): Promise<User[]> {
    return this.getAllEntities<User>('users');
  }

  async updateUser(user: User): Promise<void> {
    await this.updateEntity('users', user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.deleteEntity('users', id);
  }

  // 匹配相关操作 - 使用通用实体方法
  async saveMatch(match: Match): Promise<void> {
    await this.saveEntity('matches', match);
  }

  async getMatch(id: string): Promise<Match | null> {
    return this.getEntity<Match>('matches', id);
  }

  async getMatches(userId?: string): Promise<Match[]> {
    if (userId) {
      return this.getEntitiesByRelation<Match>('matches', 'userId', userId);
    }
    return this.getAllEntities<Match>('matches');
  }

  async updateMatch(match: Match): Promise<void> {
    await this.updateEntity('matches', match);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.deleteEntity('matches', id);
  }

  // 消息相关操作 - 使用通用实体方法
  async saveMessage(message: Message): Promise<void> {
    await this.saveEntity('messages', message);
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.getEntity<Message>('messages', id);
  }

  async getMessages(matchId: string): Promise<Message[]> {
    return this.getEntitiesByRelation<Message>('messages', 'matchId', matchId);
  }

  async updateMessage(message: Message): Promise<void> {
    await this.updateEntity('messages', message);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.deleteEntity('messages', id);
  }

  // 实现 IDatabaseClient 接口的其他必要方法
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    return this.localClient.findById<T>(tableName, id);
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    return this.localClient.findAll<T>(tableName, filter);
  }

  async create<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    const result = await this.localClient.create<T>(tableName, data);
    
    // 根据表名添加到相应的待同步列表
    if (tableName === 'messages') {
      this.addToPendingSync('messages', result);
    } else if (tableName === 'users') {
      this.addToPendingSync('users', result);
    } else if (tableName === 'matches') {
      this.addToPendingSync('matches', result);
    }
    
    return result;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    await this.localClient.update<T>(tableName, id, data);
    
    // 获取完整数据并添加到待同步列表
    const fullData = await this.localClient.findById<T>(tableName, id);
    if (fullData) {
      if (tableName === 'messages') {
        this.addToPendingSync('messages', fullData);
      } else if (tableName === 'users') {
        this.addToPendingSync('users', fullData);
      } else if (tableName === 'matches') {
        this.addToPendingSync('matches', fullData);
      }
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.localClient.delete(tableName, id);
    
    // 添加到待删除同步列表
    if (tableName === 'messages') {
      this.addToPendingSync('deletedMessages', { id });
    } else if (tableName === 'users') {
      this.addToPendingSync('deletedUsers', { id });
    } else if (tableName === 'matches') {
      this.addToPendingSync('deletedMatches', { id });
    }
  }

  async query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    return this.localClient.query<T>(tableName, options);
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    return this.localClient.executeRawQuery(query, params);
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    return this.localClient.transaction(callback);
  }

  async isTableExists(tableName: string): Promise<boolean> {
    return this.localClient.isTableExists(tableName);
  }

  // 实现缺少的 IDatabaseClient 接口方法
  async saveEntity<T extends EntityWithId>(tableName: string, entity: T): Promise<T> {
    // 根据同步策略决定保存逻辑
    if (this.syncStrategy === 'online-first' && this.isOnline) {
      try {
        // 先保存到远程
        const remoteResult = await this.remoteClient.saveEntity(tableName, entity);
        if (!remoteResult || !('id' in remoteResult)) {
          throw new Error('Invalid remote result');
        }
        // 再保存到本地
        const localResult = await this.localClient.saveEntity(tableName, remoteResult);
        if (!localResult || !('id' in localResult)) {
          throw new Error('Invalid local result');
        }
        return { ...entity, ...localResult } as T;
      } catch (error) {
        console.error(`远程保存实体失败: ${tableName}`, error);
        // 远程保存失败，回退到本地保存
        const localResult = await this.localClient.saveEntity(tableName, entity);
        if (!localResult || !('id' in localResult)) {
          throw new Error('Invalid local result');
        }
        return { ...entity, ...localResult } as T;
      }
    } else {
      // 离线优先或手动同步模式，先保存到本地
      const localResult = await this.localClient.saveEntity(tableName, entity);
      // 添加到待同步队列
      if (localResult && 'id' in localResult) {
        const result = { ...entity, ...localResult } as T;
        this.addToPendingSync(tableName, result);
        return result;
      }
      throw new Error('Invalid local result');
    }
  }

  async getEntity<T>(tableName: string, id: string): Promise<T | null> {
    // 优先从本地获取
    const localEntity = await this.localClient.getEntity<T>(tableName, id);
    
    // 如果本地没有且在线，尝试从远程获取
    if (!localEntity && this.isOnline && this.syncStrategy === 'online-first') {
      try {
        const remoteEntity = await this.remoteClient.getEntity<T>(tableName, id);
        if (remoteEntity) {
          // 保存到本地缓存
          await this.localClient.saveEntity(tableName, remoteEntity as T & { id: string });
          return remoteEntity;
        }
      } catch (error) {
        console.error(`远程获取实体失败: ${tableName}/${id}`, error);
      }
    }
    
    return localEntity;
  }

  async getAllEntities<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    // 优先从本地获取
    const localEntities = await this.localClient.getAllEntities<T>(tableName, filter);
    
    // 如果在线且是在线优先策略，尝试从远程同步
    if (this.isOnline && this.syncStrategy === 'online-first') {
      try {
        const remoteEntities = await this.remoteClient.getAllEntities<T>(tableName, filter);
        
        // 这里可以实现更复杂的合并逻辑，例如根据ID合并本地和远程实体
        // 简单起见，这里只是将远程实体保存到本地
        for (const entity of remoteEntities) {
          await this.localClient.saveEntity(tableName, entity as T & { id: string });
        }
        
        // 重新从本地获取，现在包含了同步的远程实体
        return this.localClient.getAllEntities<T>(tableName, filter);
      } catch (error) {
        console.error(`远程获取所有实体失败: ${tableName}`, error);
      }
    }
    
    return localEntities;
  }

  async updateEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    // 根据同步策略决定更新逻辑
    if (this.syncStrategy === 'online-first' && this.isOnline) {
      try {
        // 先更新远程
        await this.remoteClient.updateEntity(tableName, entity);
        // 再更新本地
        return this.localClient.updateEntity(tableName, entity);
      } catch (error) {
        console.error(`远程更新实体失败: ${tableName}/${entity.id}`, error);
        // 远程更新失败，回退到本地更新
        return this.localClient.updateEntity(tableName, entity);
      }
    } else {
      // 离线优先或手动同步模式，先更新本地
      const result = await this.localClient.updateEntity(tableName, entity);
      // 添加到待同步队列
      // 这里需要实现待同步队列的逻辑
      return result;
    }
  }

  async deleteEntity(tableName: string, id: string): Promise<boolean> {
    // 根据同步策略决定删除逻辑
    if (this.syncStrategy === 'online-first' && this.isOnline) {
      try {
        // 先从远程删除
        await this.remoteClient.deleteEntity(tableName, id);
        // 再从本地删除
        return this.localClient.deleteEntity(tableName, id);
      } catch (error) {
        console.error(`远程删除实体失败: ${tableName}/${id}`, error);
        // 远程删除失败，回退到本地删除
        return this.localClient.deleteEntity(tableName, id);
      }
    } else {
      // 离线优先或手动同步模式，先从本地删除
      const result = await this.localClient.deleteEntity(tableName, id);
      // 添加到待同步队列
      // 这里需要实现待同步队列的逻辑
      return result;
    }
  }

  async getEntitiesByRelation<T>(
    tableName: string, 
    relationField: string, 
    relationId: string
  ): Promise<T[]> {
    // 优先从本地获取
    const localEntities = await this.localClient.getEntitiesByRelation<T>(tableName, relationField, relationId);
    
    // 如果在线且是在线优先策略，尝试从远程同步
    if (this.isOnline && this.syncStrategy === 'online-first') {
      try {
        const remoteEntities = await this.remoteClient.getEntitiesByRelation<T>(tableName, relationField, relationId);
        
        // 将远程实体保存到本地
        for (const entity of remoteEntities) {
          await this.localClient.saveEntity(tableName, entity as T & { id: string });
        }
        
        // 重新从本地获取，现在包含了同步的远程实体
        return this.localClient.getEntitiesByRelation<T>(tableName, relationField, relationId);
      } catch (error) {
        console.error(`远程获取关联实体失败: ${tableName}/${relationField}/${relationId}`, error);
      }
    }
    
    return localEntities;
  }

  protected addToPendingSync(tableName: string, item: EntityWithId): void {
    const items = this.pendingSync.get(tableName) || [];
    items.push(item);
    this.pendingSync.set(tableName, items);
  }
}