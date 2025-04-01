import { Message, User } from '@/core/lib/db/types';
import { IDataService } from './data-service-interface';
import { DataServiceFactory } from './data-service-factory';
import { NetworkService } from './network-service';
import { v4 as uuidv4 } from 'uuid';

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

  private constructor() {
    this.dataService = DataServiceFactory.getDataService();
    this.networkService = NetworkService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.dataService.initialize();
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
   * 获取特定匹配的消息
   * @param matchId 匹配ID
   * @returns 消息列表
   */
  public async getMessages(matchId: string): Promise<Message[]> {
    await this.ensureInitialized();
    try {
      const messages = await this.dataService.getMessages(matchId);
      return messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * 发送消息
   * @param matchId 匹配ID
   * @param senderId 发送者ID
   * @param receiverId 接收者ID
   * @param content 消息内容
   * @param type 消息类型
   * @returns 发送结果
   */
  public async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<{ success: boolean; message?: Message; errors?: string[] }> {
    await this.ensureInitialized();
    try {
      const newMessage: Message = {
        id: uuidv4(),
        matchId,
        senderId,
        receiverId,
        content,
        type,
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const message = await this.dataService.createMessage(newMessage);
      
      // 更新匹配的最后消息时间
      await this.updateMatchLastMessageTime(matchId);
      
      // 通知监听器有新消息
      this.notifyMessageListeners(matchId);
      
      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, errors: ['Failed to send message'] };
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
}