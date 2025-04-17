import { ITestService } from '../types/test-service';
import { MockTestServiceAdapter } from '../adapters/mock-test-service-adapter';

export class TestServiceRegistry {
  private static instance: TestServiceRegistry;
  private providers: Map<string, new (...args: any[]) => ITestService> = new Map();

  private constructor() {
    this.registerProvider('mock', MockTestServiceAdapter);
  }

  public static getInstance(): TestServiceRegistry {
    if (!TestServiceRegistry.instance) {
      TestServiceRegistry.instance = new TestServiceRegistry();
    }
    return TestServiceRegistry.instance;
  }

  public getProvider(type: string): (new (...args: any[]) => ITestService) | undefined {
    return this.providers.get(type);
  }

  public registerProvider(type: string, provider: new (...args: any[]) => ITestService): void {
    this.providers.set(type, provider);
  }

  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }
}
