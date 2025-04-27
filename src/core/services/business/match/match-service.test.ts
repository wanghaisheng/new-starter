import { DefaultMatchAIAdapter } from './ai-adapters/default-match-ai-adapter';
import { MatchService } from './match-service';
import type { User } from '../user/user.types';

// Mock UserService
type UserServiceMock = {
  getUserById: (id: string) => Promise<User | undefined>;
  getRecommendedUsers: (filter: any) => Promise<{ items: User[] }>;
};

const mockUsers: User[] = [
  { id: '1', location: { latitude: 39.9, longitude: 116.4 }, tags: ['A', 'B'], mbti: 'INTJ', bazi: 'A1', phoneBrand: 'Apple', city: '北京' },
  { id: '2', location: { latitude: 31.2, longitude: 121.5 }, tags: ['B', 'C'], mbti: 'ENFP', bazi: 'B2', phoneBrand: 'Huawei', city: '上海' },
  { id: '3', location: { latitude: 23.1, longitude: 113.3 }, tags: ['A', 'C'], mbti: 'INTJ', bazi: 'C3', phoneBrand: 'Xiaomi', city: '广州' },
  { id: '4', location: null, tags: ['D'], mbti: 'ISFJ', bazi: null, phoneBrand: 'Apple', city: '深圳' },
  { id: '5', location: { latitude: 39.9, longitude: 116.4 }, tags: ['B'], mbti: 'INTJ', bazi: 'A1', phoneBrand: 'Apple', city: '北京' },
];

const userServiceMock: UserServiceMock = {
  getUserById: async (id) => mockUsers.find(u => u.id === id),
  getRecommendedUsers: async (filter) => ({ items: mockUsers.filter(u => !filter || filter(u)) }),
};

describe('MatchService', () => {
  const aiAdapter = new DefaultMatchAIAdapter();
  const service = new MatchService(userServiceMock as any, aiAdapter);

  it('should match by location', async () => {
    const result = await service.matchUsers('1', { maxDistanceKm: 10, baseFilter: () => true });
    expect(result.some(u => u.id === '5')).toBe(true);
    expect(result.some(u => u.id === '2')).toBe(false);
  });

  it('should match by tags', async () => {
    const result = await service.matchUsers('1', { includeTags: ['A'], baseFilter: () => true });
    expect(result.some(u => u.id === '3')).toBe(true);
    expect(result.some(u => u.id === '2')).toBe(false);
  });

  it('should match by MBTI', async () => {
    const result = await service.matchUsers('1', { useMBTI: true, mbtiType: 'INTJ', baseFilter: () => true });
    expect(result[0].mbti).toBe('INTJ');
  });

  it('should match by Bazi', async () => {
    const result = await service.matchUsers('1', { useBazi: true, baseFilter: () => true });
    expect(result[0].bazi).toBe('A1');
  });

  it('should match by phone brand', async () => {
    const result = await service.matchUsers('1', { phoneBrands: ['Apple'], baseFilter: () => true });
    expect(result.every(u => u.phoneBrand === 'Apple')).toBe(true);
  });

  it('should match by city', async () => {
    const result = await service.matchUsers('1', { cities: ['北京'], baseFilter: () => true });
    expect(result.every(u => u.city === '北京')).toBe(true);
  });

  it('should match randomly', async () => {
    const result = await service.matchUsers('1', { useRandom: true, limit: 2, baseFilter: () => true });
    expect(result.length).toBe(2);
  });

  it('should combine multiple filters', async () => {
    const result = await service.matchUsers('1', { maxDistanceKm: 10, includeTags: ['B'], phoneBrands: ['Apple'], baseFilter: () => true });
    expect(result.every(u => u.phoneBrand === 'Apple')).toBe(true);
    expect(result.some(u => u.id === '5')).toBe(true);
  });

  it('should return empty if user not found', async () => {
    const result = await service.matchUsers('notfound', { baseFilter: () => true });
    expect(result.length).toBe(0);
  });

  it('should respect limit', async () => {
    const result = await service.matchUsers('1', { limit: 1, baseFilter: () => true });
    expect(result.length).toBe(1);
  });
});
