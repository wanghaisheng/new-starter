import type { Message } from '../message.types';

describe('Message 类型定义', () => {
  it('结构应包含 id/senderId/receiverId/content', () => {
    const msg: Message = { id: 'msg1', senderId: 'u1', receiverId: 'u2', content: 'hello', createdAt: '', updatedAt: '' };
    expect(msg.content).toBe('hello');
  });
});
