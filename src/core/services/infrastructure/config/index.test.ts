import { describe, it, expect, beforeAll } from 'vitest';
import { initConfig, getConfigService, getConfigAdapter } from './index';
import { CONFIG_KEYS } from './config-keys';
import { ConfigService } from './service/config-service';

// 顶层 smoke 测试，验证是否被跳过
it('smoke: top-level', () => {
  expect(1).toBe(1);
});

// 基础配置服务测试用例

describe('ConfigService async 初始化链路', () => {
  beforeAll(async () => {
    ConfigService.__test_resetInstance();
    process.env[CONFIG_KEYS.LOGGER_PROVIDER] = 'mock'; // 保证测试环境有默认值
    await initConfig();
  });

  it('initConfig 后 getConfigService 可用', () => {
    const configService = getConfigService();
    expect(configService).toBeDefined();
    expect(typeof configService.get).toBe('function');
  });

  it('initConfig 后 getConfigAdapter 可用', () => {
    const configAdapter = getConfigAdapter();
    expect(configAdapter).toBeDefined();
    expect(typeof configAdapter.get).toBe('function');
  });

  it('getConfigService().get 能正确读取默认配置', () => {
    const configService = getConfigService();
    // Debug 输出
    console.log('configService.get(LOGGER_PROVIDER):', configService.get(CONFIG_KEYS.LOGGER_PROVIDER));
    console.log('process.env.LOGGER_PROVIDER:', process.env[CONFIG_KEYS.LOGGER_PROVIDER]);
    const provider = configService.get(CONFIG_KEYS.LOGGER_PROVIDER);
    expect(provider).toBeDefined();
  });

  it('多次 initConfig 不会抛出异常', async () => {
    await expect(initConfig()).resolves.toBeDefined();
  });
});
