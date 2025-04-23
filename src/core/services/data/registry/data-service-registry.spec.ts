import { DataServiceRegistry } from './data-service-registry';
import { IDataService } from '../types';

describe('DataServiceRegistry 热插拔与资源释放', () => {
  let disposeCalled = false;
  let logs: string[] = [];

  const mockLogger = {
    info: (msg: string) => logs.push('info:' + msg),
    warn: (msg: string) => logs.push('warn:' + msg),
    error: (msg: string) => logs.push('error:' + msg),
  };

  class MockService implements IDataService {
    initialized = false;
    async initialize() { this.initialized = true; }
    async dispose() { disposeCalled = true; }
  }

  beforeEach(() => {
    disposeCalled = false;
    logs = [];
    // @ts-ignore
    DataServiceRegistry.logger = mockLogger;
  });

  it('注册、获取、热切换、资源释放流程', async () => {
    // 注册初始实例
    DataServiceRegistry.register('main', () => new MockService());
    const inst1 = DataServiceRegistry.get('main') as MockService;
    expect(inst1).toBeInstanceOf(MockService);
    expect(inst1.initialized).toBe(false);

    // 热切换
    const newFactory = () => new MockService();
    await DataServiceRegistry.switchAdapter('main', newFactory);
    const inst2 = DataServiceRegistry.get('main') as MockService;
    expect(inst2).toBeInstanceOf(MockService);
    expect(inst2).not.toBe(inst1);
    expect(disposeCalled).toBe(true);

    // 日志追踪
    expect(logs.some(l => l.includes('释放旧实例资源'))).toBe(true);
    expect(logs.some(l => l.includes('注册新工厂并懒加载'))).toBe(true);
    expect(logs.some(l => l.includes('新实例已初始化'))).toBe(true);
  });

  it('异常处理: dispose 抛错时能继续切换', async () => {
    class BadService extends MockService {
      async dispose() { throw new Error('dispose error'); }
    }
    DataServiceRegistry.register('main', () => new BadService());
    DataServiceRegistry.get('main');
    // 切换时 dispose 抛错
    const newFactory = () => new MockService();
    let errorCaught = false;
    try {
      await DataServiceRegistry.switchAdapter('main', newFactory);
    } catch (e) {
      errorCaught = true;
    }
    // 期望 dispose 错误不会阻断新实例切换
    expect(errorCaught).toBe(false);
    expect(DataServiceRegistry.get('main')).toBeInstanceOf(MockService);
  });
});
