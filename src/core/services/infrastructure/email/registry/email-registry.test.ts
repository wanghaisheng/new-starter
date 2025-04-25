import { EmailFactory } from '../factory/email-factory';
import { EmailRegistry } from './email-registry';
import type { IEmailService } from '../types/email-types';

describe('EmailRegistry & EmailFactory', () => {
  it('should get built-in mock adapter', () => {
    const service = EmailFactory.createEmailService({ provider: 'mock' });
    expect(service).toBeDefined();
    expect(typeof service.sendEmail).toBe('function');
  });

  it('should get built-in smtp adapter', () => {
    const service = EmailFactory.createEmailService({ provider: 'smtp' });
    expect(service).toBeDefined();
    expect(typeof service.sendEmail).toBe('function');
  });

  it('should fallback to default if provider not found', () => {
    const service = EmailFactory.createEmailService({ provider: 'not-exist' });
    expect(service).toBeDefined();
    expect(typeof service.sendEmail).toBe('function');
  });

  it('should register and get custom adapter', () => {
    class CustomService implements IEmailService {
      async initialize() {}
      async dispose() {}
      isInitialized() { return true; }
      async sendEmail() { return; }
    }
    EmailRegistry.registerAdapter('custom', () => new CustomService());
    const service = EmailFactory.createEmailService({ provider: 'custom' });
    expect(service).toBeInstanceOf(CustomService);
  });

  it('should list all available providers', () => {
    const providers = EmailRegistry.getAvailableProviders();
    expect(providers).toEqual(expect.arrayContaining(['mock', 'smtp', 'default', 'custom']));
  });
});
