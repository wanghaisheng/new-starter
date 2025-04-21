import { MatchService } from '@/core/services/business/match/service/match-service';

describe('MatchService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new MatchService();
    expect(service).toBeDefined();
    if (service.getMatches) {
      const matches = await service.getMatches();
      expect(Array.isArray(matches)).toBe(true);
    }
  });
});
