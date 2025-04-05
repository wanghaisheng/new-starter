import { Message } from '@/core/lib/db/models/message';
import { BaseSyncClient } from '@/core/lib/db/clients/sync/base-sync-client';
import { IDatabaseClient, SyncConfig } from '@/core/lib/db/interfaces';

/**
 * 消息同步状态
 */
export type MessageSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/**
 * 扩展消息类型，添加同步状态
 */
export interface SyncableMessage extends Message {
  syncStatus: MessageSyncStatus;
}

/**
 * 消息同步客户端
 * 专门用于演示离线消息存储和在线同步
 */
export class MessageSyncClient extends BaseSyncClient implements IDatabaseClient {
  constructor(config: SyncConfig) {
    super(config);
  }

  /**
   * 同步特定集合的项目
   */
  protected async syncCollectionItems(collection: string, items: any[]): Promise<void> {
    // 优先处理消息
    if (collection === 'messages') {
      await this.syncMessages(items);
    } else {
      await this.syncGenericItems(collection, items);
    }
  }

  /**
   * 同步消息
   */
  private async syncMessages(messages: SyncableMessage[]): Promise<void> {
    const failedMessages: SyncableMessage[] = [];
    
    for (const message of messages) {
      try {
        // 更新消息状态为同步中
        message.syncStatus = 'syncing';
        await this.localClient.updateMessage(message);
        
        // 发送到远程
        await this.remoteClient.saveMessage(message);
        
        // 更新消息状态为已同步
        message.syncStatus = 'synced';
        await this.localClient.updateMessage(message);
      } catch (error) {
        console.error('同步消息失败:', error);
        
        // 更新消息状态为失败
        message.syncStatus = 'failed';
        await this.localClient.updateMessage(message);
        failedMessages.push(message);
      }
    }
    
    // 更新待处理列表，只保留失败的消息
    if (failedMessages.length > 0) {
      this.pendingSync.set('messages', failedMessages);
    } else {
      this.pendingSync.delete('messages');
    }
  }

  /**
   * 同步通用项目
   */
  private async syncGenericItems(collection: string, items: any[]): Promise<void> {
    const failedItems: any[] = [];
    
    for (const item of items) {
      try {
        // 根据不同的集合类型执行不同的同步操作
        switch (collection) {
          case 'deletedMessages':
            await this.remoteClient.deleteMessage(item.id);
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
    
    // 更新待处理列表，只保留失败的项目
    if (failedItems.length > 0) {
      this.pendingSync.set(collection, failedItems);
    } else {
      this.pendingSync.delete(collection);
    }
  }

  /**
   * 从远程获取最新消息并更新本地
   */
  async syncRemoteMessages(matchId?: string): Promise<void> {
    if (!this.isOnline) return;
    
    try {
      // 获取远程消息
      let remoteMessages: Message[] = [];
      
      if (matchId) {
        // 如果提供了匹配ID，只获取该匹配的消息
        remoteMessages = await this.remoteClient.getMessages(matchId);
      } else {
        // 否则获取所有消息
        remoteMessages = await this.remoteClient.findAll<Message>('messages');
      }
      
      // 获取本地消息
      let localMessages: Message[] = [];
      if (matchId) {
        localMessages = await this.localClient.getMessages(matchId);
      } else {
        localMessages = await this.localClient.findAll<Message>('messages');
      }
      
      // 创建本地消息ID映射，用于快速查找
      const localMessageMap = new Map<string, Message>();
      for (const msg of localMessages) {
        localMessageMap.set(msg.id, msg);
      }
      
      // 处理远程消息
      for (const remoteMsg of remoteMessages) {
        const localMsg = localMessageMap.get(remoteMsg.id);
        
        if (!localMsg) {
          // 本地不存在，添加到本地
          const syncedMsg: SyncableMessage = {
            ...remoteMsg,
            syncStatus: 'synced'
          };
          await this.localClient.saveMessage(syncedMsg);
        } else if (new Date(remoteMsg.updatedAt) > new Date(localMsg.updatedAt)) {
          // 远程版本更新，更新本地
          const syncedMsg: SyncableMessage = {
            ...remoteMsg,
            syncStatus: 'synced'
          };
          await this.localClient.updateMessage(syncedMsg);
        }
      }
    } catch (error) {
      console.error('同步远程消息失败', error);
    }
  }

  /**
   * 初始化数据库连接并同步远程消息
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // 如果在线，尝试从远程获取最新消息
    if (this.isOnline) {
      await this.syncRemoteMessages();
    }
  }

  /**
   * 保存消息并设置同步状态
   */
  async saveMessage(message: Message): Promise<void> {
    // 设置消息的同步状态
    const syncableMessage: SyncableMessage = {
      ...message,
      syncStatus: 'pending'
    };
    
    // 保存到本地
    await this.localClient.saveMessage(syncableMessage);
    
    // 根据同步策略决定是否立即同步到远程
    if (this.syncStrategy === 'online-first' && this.isOnline) {
      try {
        await this.remoteClient.saveMessage(message);
        
        // 更新本地消息状态为"已同步"
        syncableMessage.syncStatus = 'synced';
        await this.localClient.updateMessage(syncableMessage);
      } catch (error) {
        console.error('远程保存消息失败', error);
        // 添加到待同步列表
        this.addToPendingSync('messages', syncableMessage);
      }
    } else {
      // 添加到待同步列表
      this.addToPendingSync('messages', syncableMessage);
    }
  }

  /**
   * 获取消息
   */
  async getMessage(id: string): Promise<Message | null> {
    return this.localClient.getMessage(id);
  }

  /**
   * 获取匹配的所有消息
   */
  async getMessages(matchId: string): Promise<Message[]> {
    // 从本地获取
    const messages = await this.localClient.getMessages(matchId);
    
    // 如果在线，尝试同步远程消息
    if (this.isOnline && this.syncStrategy === 'online-first') {
      await this.syncRemoteMessages(matchId);
      
      // 重新获取本地消息（现在包含同步的远程消息）
      return this.localClient.getMessages(matchId);
    }
    
    return messages;
  }

  /**
   * 更新消息
   */
  async updateMessage(message: Message): Promise<void> {
    // 确保消息有同步状态
    const syncableMessage: SyncableMessage = {
      ...message,
      syncStatus: message['syncStatus'] || 'pending',
      updatedAt: new Date()
    };
    
    // 如果不是手动设置的同步状态，则设置为待同步
    if (!message['syncStatus']) {
      syncableMessage.syncStatus = 'pending';
    }
    
    // 更新本地
    await this.localClient.updateMessage(syncableMessage);
    
    // 如果消息状态不是手动设置的，则根据同步策略决定是否立即同步到远程
    if (!message['syncStatus']) {
      if (this.syncStrategy === 'online-first' && this.isOnline) {
        try {
          await this.remoteClient.updateMessage(message);
          
          // 更新本地消息状态为"已同步"
          syncableMessage.syncStatus = 'synced';
          await this.localClient.updateMessage(syncableMessage);
        } catch (error) {
          console.error('远程更新消息失败', error);
          // 添加到待同步列表
          this.addToPendingSync('messages', syncableMessage);
        }
      } else {
        // 添加到待同步列表
        this.addToPendingSync('messages', syncableMessage);
      }
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(id: string): Promise<void> {
    // 删除本地
    await this.localClient.deleteMessage(id);
    
    // 根据同步策略决定是否立即同步到远程
    if (this.syncStrategy === 'online-first' && this.isOnline) {
      try {
        await this.remoteClient.deleteMessage(id);
      } catch (error) {
        console.error('远程删除消息失败', error);
        // 添加特殊删除操作到待同步列表
        this.addToPendingSync('deletedMessages', { id });
      }
    } else {
      // 添加特殊删除操作到待同步列表
      this.addToPendingSync('deletedMessages', { id });
    }
  }

  /**
   * 获取消息的同步状态
   */
  async getMessageSyncStatus(id: string): Promise<MessageSyncStatus | null> {
    const message = await this.localClient.getMessage(id) as SyncableMessage | null;
    return message ? message.syncStatus : null;
  }

  /**
   * 获取所有待同步的消息
   */
  async getPendingMessages(): Promise<SyncableMessage[]> {
    const messages = await this.localClient.findAll<SyncableMessage>('messages');
    return messages.filter(msg => msg.syncStatus === 'pending' || msg.syncStatus === 'failed');
  }

  /**
   * 重试失败的消息同步
   */
  async retryFailedMessages(): Promise<boolean> {
    const failedMessages = await this.localClient.findAll<SyncableMessage>('messages', { syncStatus: 'failed' });
    
    if (failedMessages.length === 0) {
      return true;
    }
    
    // 添加到待同步列表
    this.pendingSync.set('messages', failedMessages);
    
    // 触发同步
    return this.manualSync();
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
    
    // 如果是消息表，添加到待同步列表
    if (tableName === 'messages') {
      const syncableData = {
        ...result,
        syncStatus: 'pending'
      } as any;
      
      this.addToPendingSync('messages', syncableData);
      
      // 更新本地状态
      await this.localClient.update(tableName, result.id, syncableData);
    }
    
    return result;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    await this.localClient.update<T>(tableName, id, data);
    
    // 如果是消息表，添加到待同步列表
    if (tableName === 'messages' && !data['syncStatus']) {
      const fullData = await this.localClient.findById<T>(tableName, id);
      if (fullData) {
        const syncableData = {
          ...fullData,
          syncStatus: 'pending'
        } as any;
        
        this.addToPendingSync('messages', syncableData);
        
        // 更新本地状态
        await this.localClient.update(tableName, id, syncableData);
      }
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.localClient.delete(tableName, id);
    
    // 如果是消息表，添加到待删除同步列表
    if (tableName === 'messages') {
      this.addToPendingSync('deletedMessages', { id });
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

  // 以下方法仅为满足接口要求，实际应用中可能不需要
  async saveUser(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持用户操作');
  }

  async getUser(): Promise<any> {
    throw new Error('方法未实现: MessageSyncClient 不支持用户操作');
  }

  async getUsers(): Promise<any[]> {
    throw new Error('方法未实现: MessageSyncClient 不支持用户操作');
  }

  async updateUser(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持用户操作');
  }

  async deleteUser(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持用户操作');
  }

  async saveMatch(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持匹配操作');
  }

  async getMatch(): Promise<any> {
    throw new Error('方法未实现: MessageSyncClient 不支持匹配操作');
  }

  async getMatches(): Promise<any[]> {
    throw new Error('方法未实现: MessageSyncClient 不支持匹配操作');
  }

  async updateMatch(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持匹配操作');
  }

  async deleteMatch(): Promise<void> {
    throw new Error('方法未实现: MessageSyncClient 不支持匹配操作');
  }
}