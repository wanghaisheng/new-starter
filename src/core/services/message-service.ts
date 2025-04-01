import { Message, User } from '../lib/db/types';
import { IDataService } from './data-service.interface';
import { DataServiceFactory } from './data-service-factory';

export class MessageService {
  private static instance: MessageService;
  private storageService: StorageService;
  private messageListeners: Map<string, ((messages: Message[]) => void)[]> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.storageService.initialize(getFirebaseConfig());
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
    try {
      const messages = await this.storageService.getMessages();
      return messages.filter(message => message.matchId === matchId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
   * @param contentType 消息类型
   * @returns 发送结果
   */
  public async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    contentType: 'text' | 'image' = 'text'
  ): Promise<{ success: boolean; message?: Message; errors?: string[] }> {
    try {
      const messages = await this.storageService.getMessages();
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        matchId,
        senderId,
        receiverId,
        content,
        contentType,
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      messages.push(newMessage);
      await this.storageService.saveMessages(messages);
      
      // 更新匹配的最后消息时间
      this.updateMatchLastMessageTime(matchId);
      
      // 通知监听器有新消息
      this.notifyMessageListeners(matchId);
      
      return { success: true, message: newMessage };
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
    try {
      const messages = await this.storageService.getMessages();
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex === -1) return false;

      messages[messageIndex].status = 'read';
      messages[messageIndex].isRead = true;
      messages[messageIndex].updatedAt = new Date().toISOString();
      
      await this.storageService.saveMessages(messages);
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
    try {
      const messages = await this.storageService.getMessages();
      let updated = false;
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.matchId === matchId && message.receiverId === userId && !message.isRead) {
          messages[i].status = 'read';
          messages[i].isRead = true;
          messages[i].updatedAt = new Date().toISOString();
          updated = true;
        }
      }
      
      if (updated) {
        await this.storageService.saveMessages(messages);
        // 通知监听器消息状态已更新
        this.notifyMessageListeners(matchId);
      }
      
      return updated;
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
    try {
      const messages = await this.storageService.getMessages();
      return messages.filter(m => m.receiverId === userId && !m.isRead).length;
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
    try {
      const messages = await this.storageService.getMessages();
      return messages.filter(m => m.matchId === matchId && m.receiverId === userId && !m.isRead).length;
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
      const matches = await this.storageService.getMatches();
      const matchIndex = matches.findIndex(m => m.id === matchId);
      
      if (matchIndex !== -1) {
        matches[matchIndex].lastMessageAt = new Date().toISOString();
        await this.storageService.saveMatches(matches);
      }
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
        listeners.forEach(listener => listener(messages));
      });
    }
  }

  /**
   * 开始轮询新消息
   * @param matchId 匹配ID
   */
  private startPollingMessages(matchId: string): void {
    // 如果已经在轮询，先停止
    this.stopPollingMessages(matchId);
    
    // 每3秒轮询一次新消息
    const interval = setInterval(() => {
      this.notifyMessageListeners(matchId);
    }, 3000);
    
    this.pollingIntervals.set(matchId, interval);
  }

  /**
   * 停止轮询新消息
   * @param matchId 匹配ID
   */
  private stopPollingMessages(matchId: string): void {
    const interval = this.pollingIntervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(matchId);
    }
  }

  /**
   * 清理所有监听器和轮询
   */
  public cleanup(): void {
    // 清理所有轮询
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    
    // 清理所有监听器
    this.messageListeners.clear();
  }
}