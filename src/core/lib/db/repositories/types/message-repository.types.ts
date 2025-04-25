import { Message } from '@/core/lib/db/types/message.types';

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  findAll(where?: Partial<Message>): Promise<Message[]>;
  create(data: Partial<Message>): Promise<Message>;
  update(id: string, data: Partial<Message>): Promise<number>;
  delete(id: string): Promise<number>;
}
