import { Message } from '@/core/lib/db/types/message.types';
import type { MessageRepository } from '../types/message-repository.types';

export class MessageRepositoryImpl implements MessageRepository {
  async findById(id: string): Promise<Message | null> {
    // TODO: implement
    return null;
  }
  async findAll(where?: Partial<Message>): Promise<Message[]> {
    // TODO: implement
    return [];
  }
  async create(data: Partial<Message>): Promise<Message> {
    // TODO: implement
    return {} as Message;
  }
  async update(id: string, data: Partial<Message>): Promise<number> {
    // TODO: implement
    return 0;
  }
  async delete(id: string): Promise<number> {
    // TODO: implement
    return 0;
  }
}
