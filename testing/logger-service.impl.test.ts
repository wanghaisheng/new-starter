import { describe, it, expect, beforeAll } from 'vitest';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import { InfrastructureServiceType } from '@/core/services/infrastructure/logger/types/logger-types';

// 捕获 console 输出辅助
function captureConsole(fn: () => void) {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => { logs.push(args.join(' ')); };
  try {
    fn();
  } finally {
    console.log = orig;
  }
  return logs;
}

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeAll(() => {
    logger = LoggerService.getInstance();
  });

  it('should be a singleton', () => {
    const logger2 = LoggerService.getInstance();
    expect(logger).toBe(logger2);
  });

  it('should set and get log level', () => {
    logger.setLevel('DEBUG');
    // @ts-ignore (private)
    expect(logger.logLevel).toBe('DEBUG');
  });

  it('should implement ILoggerService interface', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.getServiceType).toBe('function');
    expect(typeof logger.getConfig).toBe('function');
  });

  it('should return correct service type and config', () => {
    expect(logger.getServiceType()).toBe(InfrastructureServiceType.LOGGER);
    expect(logger.getConfig()).toMatchObject({ id: 'logger', type: InfrastructureServiceType.LOGGER });
  });

  it('should not throw on log methods', () => {
    expect(() => logger.debug('debug msg')).not.toThrow();
    expect(() => logger.info('info msg')).not.toThrow();
    expect(() => logger.warn('warn msg')).not.toThrow();
    expect(() => logger.error('error msg')).not.toThrow();
  });

  it('should initialize and dispose', async () => {
    await logger.initialize();
    expect(logger.isInitialized()).toBe(true);
    await logger.dispose();
    expect(logger.isInitialized()).toBe(false);
  });
});
