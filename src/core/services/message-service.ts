import { v4 as uuidv4 } from 'uuid';

import { Message, User } from '@/core/lib/db/types';

import { DataServiceFactory } from './data-service-factory';
import { IDataService } from './data-service-interface';
import { NetworkService } from './network-service';

/**
 * 离线消息项
 */
interface OfflineMessage {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  createdAt: Date;
}

/**
 * 消息服务
 * 提供消息相关功能，支持离线发送和接收
 */
export class MessageService {
  private static instance: MessageService;
  private dataService: IDataService;
  private messageListeners: Map<string, ((messages: Message[]) => void)[]> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private networkService: NetworkService;
  private initialized: boolean = false;
  private offlineMessageQueue: Map<string, OfflineMessage[]> = new Map();
  private offlineStorageKey: string = 'offline_messages';

  private constructor() {
    this.dataService = DataServiceFactory.getDataService();
    this.networkService = NetworkService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.dataService.initialize();
      
      // 加载保存的离线消息
      this.loadOfflineMessages();
      
      // 监听网络状态变化
      this.networkService.addNetworkStatusListener((status) => {
        const isOnline = status.connected;
        if (isOnline && this.hasOfflineMessages()) {
          this.syncAllOfflineMessages();
        }
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing MessageService:', error);
    }
  }

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * 获取消息列表
   * 
   * 根据匹配ID获取消息，如果在离线状态下，会返回缓存的消息
   * 同时合并离线消息队列中的消息
   * 
   * @param matchId 匹配ID
   * @param options 查询选项
   * @returns 消息列表
   */
  public async getMessages(
    matchId: string, 
    options?: { limit?: number; orderBy?: { createdAt: 'asc' | 'desc' } }
  ): Promise<Message[]> {
    // 确保服务已初始化
    await this.ensureInitialized();
    
    try {
      // 获取数据库中的消息
      const messages = await this.dataService.getMessages(matchId);
      
      // 获取离线消息队列中的消息
      let result = [...messages];
      const isOffline = this.networkService.getConnectionStatus() !== 'online';
      
      if (isOffline || this.offlineMessageQueue.has(matchId)) {
        // 如果有离线消息，需要合并
        const offlineMessages = this.offlineMessageQueue.get(matchId) || [];
        
        // 将离线消息转换为 Message 类型
        const convertedMessages: Message[] = offlineMessages.map(om => ({
          id: om.id,
          matchId: om.matchId,
          senderId: om.senderId,
          receiverId: om.receiverId,
          content: om.content,
          type: om.type as 'text' | 'image',
          status: 'sent', // 离线消息状态为 sent
          createdAt: om.createdAt,
          updatedAt: new Date()
        }));
        
        // 合并离线消息和在线消息
        result = [...result, ...convertedMessages];
        
        // 按创建时间排序
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      
      // 应用查询选项
      if (options) {
        if (options.limit) {
          result = result.slice(0, options.limit);
        }
        
        if (options.orderBy) {
          const direction = options.orderBy.createdAt === 'desc' ? -1 : 1;
          result.sort((a, b) => direction * (a.createdAt.getTime() - b.createdAt.getTime()));
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting messages for match ${matchId}:`, error);
      return [];
    }
  }

  /**
   * 发送消息，支持离线发送
   * @param matchId 匹配ID
   * @param senderId 发送者ID
   * @param receiverId 接收者ID
   * @param content 消息内容
   * @param type 消息类型
   * @returns 创建的消息
   */
  public async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: string = 'text'
  ): Promise<Message> {
    // 确保初始化完成
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 创建消息对象
    const now = new Date();
    const messageId = uuidv4();
    const message = {
      id: messageId,
      matchId,
      senderId,
      receiverId,
      content,
      type,
      status: 'sent',
      createdAt: now,
      updatedAt: now
    } as Message;
    
    // 检查是否在线
    if (this.networkService.isOnline()) {
      // 在线状态下正常发送
      try {
        const createdMessage = await this.dataService.createMessage(message);
        
        // 通知匹配的消息监听器
        this.notifyMessageListeners(matchId);
        
        return createdMessage;
      } catch (error) {
        console.error('Error sending message:', error);
        
        // 发送失败，保存到离线队列
        this.saveOfflineMessage(message);
        return message;
      }
    } else {
      // 离线状态下保存到离线队列
      console.log('Device is offline, saving message to offline queue');
      this.saveOfflineMessage(message);
      
      // 更新UI显示新消息（尽管它只存在于本地）
      this.notifyMessageListeners(matchId);
      
      return message;
    }
  }

  /**
   * 将消息标记为已读
   * @param messageId 消息ID
   * @returns 操作是否成功
   */
  public async markMessageAsRead(messageId: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      // 获取消息
      const message = await this.dataService.getMessage(messageId);
      
      // 更新消息状态为已读
      await this.dataService.updateMessage(messageId, {
        status: 'read',
        updatedAt: new Date()
      });
      
      // 通知监听器消息状态已更新
      if (message) {
        this.notifyMessageListeners(message.matchId);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * 将匹配中的所有消息标记为已读
   * @param matchId 匹配ID
   * @param userId 当前用户ID
   * @returns 操作是否成功
   */
  public async markAllMessagesAsRead(matchId: string, userId: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const messages = await this.dataService.getMessages(matchId);
      const unreadMessages = messages.filter(
        message => message.receiverId === userId && message.status !== 'read'
      );
      
      if (unreadMessages.length === 0) {
        return true; // 没有未读消息也算成功
      }
      
      // 逐个更新消息状态
      const updatePromises = unreadMessages.map(message => 
        this.dataService.updateMessage(message.id, {
          status: 'read',
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      // 通知监听器消息状态已更新
      this.notifyMessageListeners(matchId);
      
      return true;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }

  /**
   * 获取用户的未读消息数量
   * @param userId 用户ID
   * @returns 未读消息数量
   */
  public async getUnreadMessageCount(userId: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const messages = await this.dataService.getUnreadMessages(userId);
      return messages.length;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * 获取匹配的未读消息数量
   * @param matchId 匹配ID
   * @param userId 用户ID
   * @returns 未读消息数量
   */
  public async getMatchUnreadMessageCount(matchId: string, userId: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const messages = await this.dataService.getMessages(matchId);
      return messages.filter(m => m.receiverId === userId && m.status !== 'read').length;
    } catch (error) {
      console.error('Error getting match unread message count:', error);
      return 0;
    }
  }

  /**
   * 更新匹配的最后消息时间
   * @param matchId 匹配ID
   */
  private async updateMatchLastMessageTime(matchId: string): Promise<void> {
    try {
      // 获取匹配信息
      const match = await this.dataService.getMatch(matchId);
      
      // 更新匹配信息
      await this.dataService.updateMatch(matchId, {
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating match last message time:', error);
    }
  }

  /**
   * 添加消息监听器
   * @param matchId 匹配ID
   * @param listener 监听器回调函数
   * @returns 取消监听的函数
   */
  public addMessageListener(matchId: string, listener: (messages: Message[]) => void): () => void {
    if (!this.messageListeners.has(matchId)) {
      this.messageListeners.set(matchId, []);
      // 开始轮询新消息
      this.startPollingMessages(matchId);
    }
    
    const listeners = this.messageListeners.get(matchId) || [];
    listeners.push(listener);
    this.messageListeners.set(matchId, listeners);
    
    // 立即通知当前消息
    this.getMessages(matchId).then(messages => listener(messages));
    
    // 返回取消监听的函数
    return () => this.removeMessageListener(matchId, listener);
  }

  /**
   * 移除消息监听器
   * @param matchId 匹配ID
   * @param listener 监听器回调函数
   */
  private removeMessageListener(matchId: string, listener: (messages: Message[]) => void): void {
    const listeners = this.messageListeners.get(matchId) || [];
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      this.messageListeners.set(matchId, listeners);
      
      // 如果没有监听器了，停止轮询
      if (listeners.length === 0) {
        this.stopPollingMessages(matchId);
      }
    }
  }

  /**
   * 通知消息监听器
   * @param matchId 匹配ID
   */
  private notifyMessageListeners(matchId: string): void {
    const listeners = this.messageListeners.get(matchId) || [];
    
    if (listeners.length > 0) {
      this.getMessages(matchId).then(messages => {
        for (const listener of listeners) {
          try {
            listener(messages);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        }
      });
    }
  }

  /**
   * 开始轮询消息
   * @param matchId 匹配ID
   */
  private startPollingMessages(matchId: string): void {
    if (this.pollingIntervals.has(matchId)) {
      return;
    }
    
    const intervalId = setInterval(() => {
      this.notifyMessageListeners(matchId);
    }, 3000); // 每3秒轮询一次
    
    this.pollingIntervals.set(matchId, intervalId);
  }

  /**
   * 停止轮询消息
   * @param matchId 匹配ID
   */
  private stopPollingMessages(matchId: string): void {
    const intervalId = this.pollingIntervals.get(matchId);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(matchId);
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

  /**
   * 清理资源
   */
  public cleanup(): void {
    // 清理所有轮询间隔
    for (const [matchId, intervalId] of Array.from(this.pollingIntervals.entries())) {
      clearInterval(intervalId);
    }
    
    this.pollingIntervals.clear();
    this.messageListeners.clear();
  }

  /**
   * 获取离线消息数量
   * 
   * @param matchId 可选的匹配ID，如果提供则只返回该匹配的离线消息数量
   * @returns 离线消息数量
   */
  public async getOfflineMessagesCount(matchId?: string): Promise<number> {
    await this.ensureInitialized();
    
    if (matchId) {
      // 如果提供了匹配ID，只返回该匹配的离线消息数量
      const matchMessages = this.offlineMessageQueue.get(matchId) || [];
      return matchMessages.length;
    } else {
      // 否则返回所有离线消息的数量
      let totalCount = 0;
      this.offlineMessageQueue.forEach(messages => {
        totalCount += messages.length;
      });
      return totalCount;
    }
  }

  /**
   * 同步离线消息
   * 
   * 将特定匹配的离线消息发送到服务器
   * 
   * @param matchId 匹配ID
   * @returns 成功同步的消息数量
   */
  public async syncOfflineMessages(matchId: string): Promise<number> {
    await this.ensureInitialized();
    
    // 检查网络连接
    if (!this.networkService.isOnline()) {
      console.log('Cannot sync offline messages: device is offline');
      return 0;
    }
    
    // 获取匹配的离线消息
    const offlineMessages = this.offlineMessageQueue.get(matchId) || [];
    if (offlineMessages.length === 0) {
      return 0;
    }
    
    console.log(`Syncing ${offlineMessages.length} offline messages for match ${matchId}`);
    
    // 同步消息计数
    let syncedCount = 0;
    
    // 创建同步副本以避免在遍历过程中修改数组
    const messagesToSync = [...offlineMessages];
    
    // 通知网络服务开始同步
    this.networkService.updateSyncStatus('syncing', {
      pending: messagesToSync.length,
      completed: 0,
      failed: 0
    });
    
    // 逐一同步消息
    for (const message of messagesToSync) {
      try {
        // 将离线消息转换为Message对象并发送到服务器
        await this.dataService.createMessage({
          id: message.id,
          matchId: message.matchId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          type: message.type as 'text' | 'image',
          status: 'sent',
          createdAt: message.createdAt,
          updatedAt: new Date()
        });
        
        // 从队列中移除已同步的消息
        this.removeOfflineMessage(matchId, message.id);
        syncedCount++;
        
        // 更新同步状态
        this.networkService.updateSyncStatus('syncing', {
          pending: messagesToSync.length - syncedCount,
          completed: syncedCount,
          failed: 0
        });
      } catch (error) {
        console.error(`Failed to sync offline message ${message.id}:`, error);
        
        // 更新同步状态以显示失败
        this.networkService.updateSyncStatus('error', {
          pending: messagesToSync.length - syncedCount - 1,
          completed: syncedCount,
          failed: 1
        });
      }
    }
    
    // 保存更新后的离线队列
    this.persistOfflineMessages();
    
    // 通知消息监听器
    this.notifyMessageListeners(matchId);
    
    // 更新同步状态
    if (syncedCount > 0) {
      if (syncedCount === messagesToSync.length) {
        this.networkService.updateSyncStatus('synced');
      } else {
        this.networkService.updateSyncStatus('error', {
          pending: 0,
          completed: syncedCount,
          failed: messagesToSync.length - syncedCount
        });
      }
    }
    
    return syncedCount;
  }

  /**
   * 同步所有离线消息
   * 
   * @returns 成功同步的消息总数
   */
  public async syncAllOfflineMessages(): Promise<number> {
    await this.ensureInitialized();
    
    // 检查网络连接
    if (!this.networkService.isOnline()) {
      console.log('Cannot sync offline messages: device is offline');
      return 0;
    }
    
    let totalSynced = 0;
    
    // 获取所有匹配ID
    const matchIds = Array.from(this.offlineMessageQueue.keys());
    
    // 逐个同步每个匹配的消息
    for (const matchId of matchIds) {
      const syncedCount = await this.syncOfflineMessages(matchId);
      totalSynced += syncedCount;
    }
    
    return totalSynced;
  }

  /**
   * 保存离线消息
   * 
   * @param message 要保存的消息
   * @returns 是否成功保存
   */
  public async saveOfflineMessage(message: Message | Partial<OfflineMessage>): Promise<boolean> {
    await this.ensureInitialized();
    
    // 确保消息有必要的字段
    if (!message.matchId) {
      console.error('Cannot save offline message: matchId is required');
      return false;
    }
    
    // 准备离线消息对象
    const offlineMessage: OfflineMessage = {
      id: message.id || uuidv4(),
      matchId: message.matchId,
      senderId: message.senderId || '',
      receiverId: message.receiverId || '',
      content: message.content || '',
      type: (message.type as string) || 'text',
      createdAt: message.createdAt || new Date()
    };
    
    // 获取匹配的离线消息队列
    let matchMessages = this.offlineMessageQueue.get(offlineMessage.matchId);
    
    // 如果队列不存在，创建一个新的
    if (!matchMessages) {
      matchMessages = [];
      this.offlineMessageQueue.set(offlineMessage.matchId, matchMessages);
    }
    
    // 添加消息到队列
    matchMessages.push(offlineMessage);
    
    // 保存队列到本地存储
    this.persistOfflineMessages();
    
    // 通知匹配的消息监听器
    this.notifyMessageListeners(offlineMessage.matchId);
    
    return true;
  }

  /**
   * 从离线队列中移除消息
   * 
   * @param matchId 匹配ID
   * @param messageId 消息ID
   */
  private removeOfflineMessage(matchId: string, messageId: string): void {
    const matchMessages = this.offlineMessageQueue.get(matchId);
    if (matchMessages) {
      const index = matchMessages.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        matchMessages.splice(index, 1);
        
        // 如果队列为空，删除这个匹配的队列
        if (matchMessages.length === 0) {
          this.offlineMessageQueue.delete(matchId);
        }
      }
    }
  }

  /**
   * 检查是否有离线消息
   * 
   * @returns 是否有离线消息
   */
  public hasOfflineMessages(): boolean {
    return this.offlineMessageQueue.size > 0;
  }

  /**
   * 将离线消息队列持久化到本地存储
   */
  private persistOfflineMessages(): void {
    try {
      // 将队列转换为可序列化的格式
      const serializable: Record<string, OfflineMessage[]> = {};
      this.offlineMessageQueue.forEach((messages, matchId) => {
        serializable[matchId] = messages;
      });
      
      // 保存到本地存储
      localStorage.setItem(this.offlineStorageKey, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to persist offline messages:', error);
    }
  }

  /**
   * 从本地存储加载离线消息队列
   */
  private loadOfflineMessages(): void {
    try {
      // 从本地存储中获取数据
      const stored = localStorage.getItem(this.offlineStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, OfflineMessage[]>;
        
        // 将数据加载到队列中
        Object.entries(parsed).forEach(([matchId, messages]) => {
          // 转换日期字符串为Date对象
          const converted = messages.map(msg => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }));
          
          this.offlineMessageQueue.set(matchId, converted);
        });
        
        console.log(`Loaded ${this.offlineMessageQueue.size} offline message queues`);
      }
    } catch (error) {
      console.error('Failed to load offline messages from storage:', error);
    }
  }
}