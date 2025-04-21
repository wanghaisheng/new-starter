import { MessageService } from '@/core/services/business/messages/service/message-service';

describe('MessageService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new MessageService();
    expect(service).toBeDefined();
    if (service.getMessages) {
      const messages = await service.getMessages();
      expect(Array.isArray(messages)).toBe(true);
    }
  });
});
