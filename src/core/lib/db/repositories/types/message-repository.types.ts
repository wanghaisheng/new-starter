import { Message } from "@/core/lib/db/types/message.types";
import { IBaseRepository } from "./base-repository.types";

// 消息仓储接口，继承通用仓储接口并扩展消息领域特有方法
export interface IMessageRepository extends IBaseRepository<Message> {
  // 查询某用户的所有消息
  findByUserId(userId: string): Promise<Message[]>;
  // 查询会话下所有消息
  findByConversationId(conversationId: string): Promise<Message[]>;
  // 标记消息为已读
  markAsRead(messageId: string): Promise<boolean>;
  // 批量标记为已读
  markMultipleAsRead(messageIds: string[]): Promise<number>;
  // ...可根据业务需求扩展
}