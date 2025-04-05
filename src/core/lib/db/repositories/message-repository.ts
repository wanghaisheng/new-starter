import { DatabaseError } from '@/core/lib/db/errors/database-error';
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { CreateMessageData } from '@/core/lib/db/types/message';
import { Message } from '@/core/lib/db/types/message';

import { BaseRepository } from './base-repository';

/**
 * 消息仓储类
 * 处理用户消息相关的数据访问
 * 
 * @description
 * 提供消息数据的访问和操作方法，包括查询、创建、更新和删除消息
 */
export class MessageRepository extends BaseRepository<Message> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'messages');
  }

  /**
   * 创建新消息
   * @param data 消息数据
   * @returns 创建的消息
   * @throws {DatabaseError} 当创建失败时抛出
   */
  async createMessage(data: CreateMessageData): Promise<Message> {
    try {
      const messageData = {
        ...data,
        type: data.type || 'text',
        status: 'sent' as const
      };
      return await this.create(messageData);
    } catch (error) {
      throw new DatabaseError(
        '创建消息失败',
        'CREATE_ERROR',
        { data, error }
      );
    }
  }

  /**
   * 查找匹配的所有消息
   * @param matchId 匹配ID
   * @returns 消息列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByMatchId(matchId: string): Promise<Message[]> {
    try {
      const result = await this.query({
        where: { matchId },
        orderBy: { field: 'createdAt', direction: 'asc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找匹配 ${matchId} 的所有消息失败`,
        'QUERY_ERROR',
        { matchId, error }
      );
    }
  }

  /**
   * 获取用户的所有消息
   * @param userId 用户ID
   * @returns 消息列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserId(userId: string): Promise<Message[]> {
    try {
      const result = await this.query({
        where: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId} 的所有消息失败`,
        'QUERY_ERROR',
        { userId, error }
      );
    }
  }

  /**
   * 获取用户未读消息
   * @param userId 用户ID
   * @returns 未读消息列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findUnreadByUserId(userId: string): Promise<Message[]> {
    try {
      const result = await this.query({
        where: {
          receiverId: userId,
          status: 'sent'
        },
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId} 的未读消息失败`,
        'QUERY_ERROR',
        { userId, error }
      );
    }
  }

  /**
   * 标记消息为已读
   * @param messageId 消息ID
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.update(messageId, { 
        status: 'read' as const,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new DatabaseError(
        `标记消息 ${messageId} 为已读失败`,
        'UPDATE_ERROR',
        { messageId, error }
      );
    }
  }

  /**
   * 标记多条消息为已读
   * @param messageIds 消息ID列表
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    try {
      // 使用事务确保原子性操作
      await this.transaction(async () => {
        const updatePromises = messageIds.map(id => this.update(id, { 
          status: 'read' as const,
          updatedAt: new Date()
        }));
        await Promise.all(updatePromises);
      });
    } catch (error) {
      throw new DatabaseError(
        `批量标记消息为已读失败`,
        'UPDATE_ERROR',
        { messageIds, error }
      );
    }
  }
  
  /**
   * 获取未读消息数量
   * @param userId 用户ID
   * @param matchId 匹配ID（可选）
   * @returns 未读消息数量
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async getUnreadCount(userId: string, matchId?: string): Promise<number> {
    try {
      const whereClause: any = {
        receiverId: userId,
        status: 'sent'
      };
      
      if (matchId) {
        whereClause.matchId = matchId;
      }
      
      const result = await this.query({
        where: whereClause
      });
      
      return result.data.length;
    } catch (error) {
      throw new DatabaseError(
        `获取未读消息数量失败`,
        'QUERY_ERROR',
        { userId, matchId, error }
      );
    }
  }
}