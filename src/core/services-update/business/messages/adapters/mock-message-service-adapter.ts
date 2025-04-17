import { IMessageService } from '../types/message-service';
import { IDataService } from '@/core/services-update/data/types';
import { Message } from '@/core/lib/db/models';

export class MockMessageServiceAdapter implements IMessageService {
  constructor(private dataService: IDataService) {}
  async saveMessage(message: Message): Promise<void> {
    if (message.id) {
      await this.dataService.update('messages', message.id, message);
    } else {
      await this.dataService.insert('messages', message);
    }
  }
  async getMessage(id: string): Promise<Message | null> {
    const result = await this.dataService.findOne<Message>('messages', { id });
    return result ? new Message(result) : null;
  }
  async getMessages(matchId: string): Promise<Message[]> {
    const messages = await this.dataService.query<Message>('messages', { matchId });
    return messages.map(message => new Message(message));
  }
  async deleteMessage(id: string): Promise<void> {
    await this.dataService.delete('messages', id);
  }
}
