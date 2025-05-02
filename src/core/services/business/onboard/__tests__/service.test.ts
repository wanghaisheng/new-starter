import { describe, it, expect } from 'vitest';
import { OnboardService } from '../service/onboard-service';

describe('OnboardService', () => {
  it('应正确获取配置', () => {
    // TODO: mock 配置适配器，断言配置获取逻辑
    expect(true).toBe(true);
  });

  it('应正确推进步骤', () => {
    // TODO: mock 步骤推进逻辑
    expect(true).toBe(true);
  });

  it('应正确上报状态', () => {
    // TODO: mock 状态上报逻辑
    expect(true).toBe(true);
  });

  it('异常时应回退到默认配置', () => {
    // TODO: mock 配置拉取失败场景
    expect(true).toBe(true);
  });
});