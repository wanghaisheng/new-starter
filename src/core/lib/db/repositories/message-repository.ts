import { BaseRepository } from './base-repository';
import { Message } from '../models/message';
import { IBaseDatabaseClient } from '../interfaces';

/**
 * 消息仓储类
 * 处理消息相关的数据访问
 */
export class MessageRepository extends BaseRepository<Message> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'messages');
  }
  
  /**
   * 查找匹配的所有消息
   * @param matchId 匹配ID
   * @returns 消息列表
   */
  async findByMatchId(matchId: string): Promise<Message[]> {
    return this.query({
      where: { matchId },
      orderBy: 'sentAt'
    });
  }
  
  /**
   * 查找用户发送的所有消息
   * @param senderId 发送者ID
   * @returns 消息列表
   */
  async findBySenderId(senderId: string): Promise<Message[]> {
    return this.query({
      where: { senderId }
    });
  }
  
  /**
   * 查找未读消息
   * @param matchId 匹配ID
   * @param userId 用户ID
   * @returns 未读消息列表
   */
  async findUnread(matchId: string, userId: string): Promise<Message[]> {
    return this.query({
      where: {
        matchId,
        senderId: { $ne: userId },
        readAt: null
      }
    });
  }
  
  /**
   * 标记消息为已读
   * @param messageId 消息ID
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.update(messageId, {
      readAt: new Date()
    } as Partial<Message>);
  }
}