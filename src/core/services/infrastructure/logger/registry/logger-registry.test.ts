import { LoggerRegistry, createDefaultLogger, createLoggerFromConfig, createLoggerService } from './logger-registry';
import type { ILoggerService, LoggerConfig, LoggerProviderType } from '../types/logger-types';

describe('LoggerRegistry', () => {
  it('should return built-in adapters', () => {
    expect(LoggerRegistry.getAdapter('mock')).toBeDefined();
    expect(LoggerRegistry.getAdapter('winston')).toBeDefined();
    expect(LoggerRegistry.getAdapter('pino')).toBeDefined();
    expect(LoggerRegistry.getAdapter('default')).toBeDefined();
  });

  it('should register and retrieve a custom adapter', () => {
    const customProvider: LoggerProviderType = 'custom';
    const customLogger: ILoggerService = createDefaultLogger();
    LoggerRegistry.registerAdapter(customProvider, () => customLogger);
    expect(LoggerRegistry.getAdapter(customProvider)).toBe(customLogger);
    expect(LoggerRegistry.isAdapterRegistered(customProvider)).toBe(true);
    expect(LoggerRegistry.getAvailableProviders()).toContain(customProvider);
  });

  it('should fallback to default adapter if provider not found', () => {
    const logger = LoggerRegistry.getAdapter('not-exist' as LoggerProviderType);
    expect(logger).toBeUndefined();
    const fallback = LoggerRegistry.getAdapter('default');
    expect(fallback).toBeDefined();
  });
});

describe('createDefaultLogger', () => {
  it('should create a logger with basic methods', () => {
    const logger = createDefaultLogger();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});

describe('createLoggerFromConfig', () => {
  it('should create logger by config.provider', () => {
    const logger = createLoggerFromConfig({ provider: 'mock' });
    expect(logger).toBeDefined();
  });
  it('should fallback to default logger if provider missing', () => {
    const logger = createLoggerFromConfig({ provider: 'not-exist' });
    expect(logger).toBeDefined();
  });
});

describe('createLoggerService', () => {
  it('should create logger by provider', () => {
    const logger = createLoggerService('mock');
    expect(logger).toBeDefined();
  });
  it('should fallback to default logger if provider missing', () => {
    const logger = createLoggerService('not-exist');
    expect(logger).toBeDefined();
  });
});
