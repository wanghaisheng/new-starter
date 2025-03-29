import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Message } from '../types';

/**
 * 消息仓储类
 * 处理用户消息相关的数据访问
 */
export class MessageRepository extends BaseRepository<Message> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'messages');
  }

  /**
   * 获取匹配的所有消息
   * @param matchId 匹配ID
   * @returns 消息列表
   */
  async findByMatchId(matchId: string): Promise<Message[]> {
    return this.query({
      where: { matchId },
      orderBy: 'createdAt'
    });
  }

  /**
   * 获取用户的所有消息
   * @param userId 用户ID
   * @returns 消息列表
   */
  async findByUserId(userId: string): Promise<Message[]> {
    return this.query({
      where: {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: '-createdAt'
    });
  }

  /**
   * 获取用户未读消息
   * @param userId 用户ID
   * @returns 未读消息列表
   */
  async findUnreadByUserId(userId: string): Promise<Message[]> {
    return this.query({
      where: {
        receiverId: userId,
        isRead: false
      },
      orderBy: '-createdAt'
    });
  }

  /**
   * 标记消息为已读
   * @param messageId 消息ID
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.update(messageId, { isRead: true });
  }

  /**
   * 批量标记消息为已读
   * @param messageIds 消息ID列表
   */
  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(
      messageIds.map(id => this.update(id, { isRead: true }))
    );
  }
}