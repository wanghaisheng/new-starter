import { MessageService } from '@/core/services/business/messages/service/message-service';

const mockAdapter = {
  getMessages: jest.fn(() => Promise.resolve([{ id: 'm1', content: 'hi' }])),
  sendMessage: jest.fn(() => Promise.resolve({ id: 'm2', content: 'sent' })),
  deleteMessage: jest.fn(() => Promise.resolve(true)),
};

describe('MessageService 单元测试', () => {
  let service: MessageService;

  beforeEach(() => {
    service = new MessageService(mockAdapter as any);
  });

  it('getMessages: 应能获取消息列表', async () => {
    const messages = await service.getMessages('user1');
    expect(Array.isArray(messages)).toBe(true);
  });

  it('sendMessage: 应能发送消息', async () => {
    const msg = await service.sendMessage('user1', 'hello');
    expect(msg).toBeDefined();
    expect(msg.content).toBe('sent');
  });

  it('deleteMessage: 应能删除消息', async () => {
    const res = await service.deleteMessage('m1');
    expect(res).toBe(true);
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      getMessages: () => { throw new Error('fail'); },
      sendMessage: () => { throw new Error('fail'); },
      deleteMessage: () => { throw new Error('fail'); },
    };
    const errorService = new MessageService(errorAdapter as any);
    await expect(errorService.getMessages('u')).rejects.toThrow('fail');
    await expect(errorService.sendMessage('u', 'x')).rejects.toThrow('fail');
    await expect(errorService.deleteMessage('id')).rejects.toThrow('fail');
  });
});
