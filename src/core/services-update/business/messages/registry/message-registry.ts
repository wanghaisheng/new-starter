import { IMessageService } from '../types/message-service';
import { MockMessageServiceAdapter } from '../adapters/mock-message-service-adapter';

export class MessageServiceRegistry {
  private static instance: MessageServiceRegistry;
  private providers: Map<string, new (...args: any[]) => IMessageService> = new Map();

  private constructor() {
    this.registerProvider('mock', MockMessageServiceAdapter);
  }

  public static getInstance(): MessageServiceRegistry {
    if (!MessageServiceRegistry.instance) {
      MessageServiceRegistry.instance = new MessageServiceRegistry();
    }
    return MessageServiceRegistry.instance;
  }

  public getProvider(type: string): (new (...args: any[]) => IMessageService) | undefined {
    return this.providers.get(type);
  }

  public registerProvider(type: string, provider: new (...args: any[]) => IMessageService): void {
    this.providers.set(type, provider);
  }

  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }
}
