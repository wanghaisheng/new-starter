import { MatchService } from '@/core/services/business/match/service/match-service';

describe('MatchService 单元测试', () => {
  const mockAdapter = {
    getMatches: jest.fn(() => Promise.resolve([{ id: 'm1', name: 'mock' }])),
    createMatch: jest.fn(() => Promise.resolve({ id: 'm2', name: 'created' })),
    deleteMatch: jest.fn(() => Promise.resolve(true)),
  };

  let service: MatchService;

  beforeEach(() => {
    service = new MatchService(mockAdapter as any);
  });

  it('getMatches: 应能获取匹配列表', async () => {
    const matches = await service.getMatches('user1');
    expect(Array.isArray(matches)).toBe(true);
  });

  it('createMatch: 应能创建匹配', async () => {
    const match = await service.createMatch({ name: 'created' });
    expect(match).toBeDefined();
    expect(match.name).toBe('created');
  });

  it('deleteMatch: 应能删除匹配', async () => {
    const res = await service.deleteMatch('m1');
    expect(res).toBe(true);
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      getMatches: () => { throw new Error('fail'); },
      createMatch: () => { throw new Error('fail'); },
      deleteMatch: () => { throw new Error('fail'); },
    };
    const errorService = new MatchService(errorAdapter as any);
    await expect(errorService.getMatches('u')).rejects.toThrow('fail');
    await expect(errorService.createMatch({})).rejects.toThrow('fail');
    await expect(errorService.deleteMatch('id')).rejects.toThrow('fail');
  });
});
