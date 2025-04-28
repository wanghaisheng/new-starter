import { OnboardService } from './onboard-service';
import type { OnboardConfig, OnboardStep } from '@/core/lib/db/types/onboard.types';

describe('OnboardService', () => {
  let service: OnboardService;

  beforeEach(() => {
    service = new OnboardService();
  });

  describe('getConfig', () => {
    it('应返回默认配置', async () => {
      const config = await service.getConfig();
      expect(config).toHaveProperty('steps');
      expect(config.locale).toBe('zh');
      expect(config.platform).toBe('app');
      expect(config.configVersion).toBe('1.0.0');
      expect(Array.isArray(config.steps)).toBe(true);
    });

    it('locale、abTestGroup、platform 参数不同也应返回默认配置', async () => {
      const config = await service.getConfig({ locale: 'en', abTestGroup: 'A', platform: 'web' });
      expect(config.locale).toBe('zh');
      expect(config.platform).toBe('app');
    });
  });

  describe('getSteps', () => {
    it('应返回默认步骤数组', async () => {
      const steps = await service.getSteps();
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('title');
      expect(steps[0]).toHaveProperty('desc');
      expect(steps[0]).toHaveProperty('image');
    });

    it('传递不同参数也应返回默认步骤', async () => {
      const steps = await service.getSteps({ locale: 'en', abTestGroup: 'B', platform: 'web' });
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
    });
  });
});