import type { Translation } from '../translation.types';

describe('Translation 类型定义', () => {
  it('结构应包含 key/value/language', () => {
    const t: Translation = { id: 't1', key: 'greet', value: '你好', language: 'zh', updatedAt: '' };
    expect(t.language).toBe('zh');
  });
});
