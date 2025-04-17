import { MockMessageServiceAdapter } from '../adapters/mock-message-service-adapter';
import { RemoteMessageServiceAdapter } from '../adapters/remote-message-service-adapter';
import { HybridMessageServiceAdapter } from '../adapters/hybrid-message-service-adapter';
import { AdvancedHybridMessageServiceAdapter } from '../adapters/advanced-hybrid-message-service-adapter';
import { MessageServiceFactory } from '../factory/message-service-factory';
import { IMessageService } from '../types/message-service';

const mockMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'u1',
  receiverId: 'u2',
  content: 'hello',
  status: 'sent',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Message Service Adapter', () => {
  let service: IMessageService;

  beforeEach(() => {
    service = new MockMessageServiceAdapter();
  });

  it('should send, get, update, delete and mark as read (mock)', async () => {
    // send
    const sent = await service.sendMessage({
      conversationId: 'c1', senderId: 'u1', receiverId: 'u2', content: 'hello'
    });
    expect(sent.content).toBe('hello');

    // getUserMessages
    const userMsgs = await service.getUserMessages('u1');
    expect(userMsgs.length).toBe(1);
    // getConversationMessages
    const convMsgs = await service.getConversationMessages('c1');
    expect(convMsgs.length).toBe(1);

    // update
    const updated = await service.updateMessage(sent.id, { content: 'hi' });
    expect(updated.content).toBe('hi');

    // markAsRead
    await service.markAsRead(sent.id);
    const afterRead = await service.getUserMessages('u1');
    expect(afterRead[0].status).toBe('read');

    // delete
    await service.deleteMessage(sent.id);
    const afterDel = await service.getUserMessages('u1');
    expect(afterDel.length).toBe(0);
  });

  it('should create hybrid adapter and fallback to remote', async () => {
    const remote = new RemoteMessageServiceAdapter();
    const hybrid = new HybridMessageServiceAdapter(service, remote);
    // mock remote.getUserMessages
    jest.spyOn(remote, 'getUserMessages').mockResolvedValue([mockMessage]);
    // 本地无数据，走远程
    const msgs = await hybrid.getUserMessages('u2');
    expect(msgs[0].id).toBe('m1');
  });

  it('should create advanced-hybrid adapter and support CRUD', async () => {
    const advancedHybrid = new AdvancedHybridMessageServiceAdapter();
    // send
    const sent = await advancedHybrid.sendMessage({
      conversationId: 'c2', senderId: 'u3', receiverId: 'u4', content: 'advanced hello'
    });
    expect(sent.content).toBe('advanced hello');
    // getUserMessages
    const userMsgs = await advancedHybrid.getUserMessages('u3');
    expect(userMsgs.some(m => m.content === 'advanced hello')).toBe(true);
    // update
    const updated = await advancedHybrid.updateMessage(sent.id, { content: 'advanced hi' });
    expect(updated.content).toBe('advanced hi');
    // markAsRead
    await advancedHybrid.markAsRead(sent.id);
    const afterRead = await advancedHybrid.getUserMessages('u3');
    expect(afterRead.find(m => m.id === sent.id)?.status).toBe('read');
    // delete
    await advancedHybrid.deleteMessage(sent.id);
    const afterDel = await advancedHybrid.getUserMessages('u3');
    expect(afterDel.find(m => m.id === sent.id)).toBeFalsy();
  });

  it('should create by factory', () => {
    expect(() => MessageServiceFactory.createService('mock')).not.toThrow();
    expect(() => MessageServiceFactory.createService('remote')).not.toThrow();
    expect(() => MessageServiceFactory.createService('hybrid')).not.toThrow();
  });
});
