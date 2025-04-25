import { Message } from '@/core/lib/db/types/message.types';
import type { MessageRepository } from '../types/message-repository.types';

export class MessageRepositoryDrizzle implements MessageRepository {
  async findById(id: string): Promise<Message | null> {
    // TODO: implement drizzle query
    return null;
  }
  async findAll(where?: Partial<Message>): Promise<Message[]> {
    // TODO: implement drizzle query
    return [];
  }
  async create(data: Partial<Message>): Promise<Message> {
    // TODO: implement drizzle insert
    return {} as Message;
  }
  async update(id: string, data: Partial<Message>): Promise<number> {
    // TODO: implement drizzle update
    return 0;
  }
  async delete(id: string): Promise<number> {
    // TODO: implement drizzle delete
    return 0;
  }
}
