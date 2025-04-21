// MockEmailAdapter: 测试/Mock 邮件适配器实现
import { IEmailService, EmailOptions, InfrastructureServiceType, InfrastructureServiceConfig } from '../../types';

export class MockEmailAdapter implements IEmailService {
  private static instance: MockEmailAdapter;
  private _isInitialized = false;
  private config: InfrastructureServiceConfig = { id: 'mock-email', type: 'email' };

  private constructor() {}

  static getInstance(): MockEmailAdapter {
    if (!MockEmailAdapter.instance) {
      MockEmailAdapter.instance = new MockEmailAdapter();
    }
    return MockEmailAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.EMAIL; }
  getConfig(): InfrastructureServiceConfig { return this.config; }

  async sendEmail(options: EmailOptions): Promise<void> {
    // mock 逻辑：控制台输出
    console.log('[MockEmailAdapter] 模拟发送邮件:', options);
  }
}
