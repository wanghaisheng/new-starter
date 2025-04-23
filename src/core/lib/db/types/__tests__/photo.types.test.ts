import type { Photo } from '../photo.types';

describe('Photo 类型定义', () => {
  it('结构应包含 id/url/userId', () => {
    const p: Photo = { id: 'p1', url: 'http://test', userId: 'u1', createdAt: '', updatedAt: '' };
    expect(p.url).toMatch('http');
  });
});
