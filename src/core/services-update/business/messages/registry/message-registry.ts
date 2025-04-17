import { IMessageService } from '../types/message-service';
import { MessageServiceFactory } from '../factory/message-service-factory';

export class MessageServiceRegistry {
  private static instance: MessageServiceRegistry;
  private providers: Map<string, () => IMessageService> = new Map();

  private constructor() {
    this.registerProvider('mock', () => MessageServiceFactory.createService('mock'));
    this.registerProvider('remote', () => MessageServiceFactory.createService('remote'));
  }

  public static getInstance(): MessageServiceRegistry {
    if (!MessageServiceRegistry.instance) {
      MessageServiceRegistry.instance = new MessageServiceRegistry();
    }
    return MessageServiceRegistry.instance;
  }

  public getProvider(type: string): (() => IMessageService) | undefined {
    return this.providers.get(type);
  }

  public registerProvider(type: string, factory: () => IMessageService): void {
    this.providers.set(type, factory);
  }

  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }
}
