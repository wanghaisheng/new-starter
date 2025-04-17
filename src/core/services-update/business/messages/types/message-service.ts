import { Message } from '@/core/lib/db/models';
import { IService } from '@/core/services-update/types';

export interface IMessageService extends IService {
  saveMessage(message: Message): Promise<void>;
  getMessage(id: string): Promise<Message | null>;
  getMessages(matchId: string): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;
}
