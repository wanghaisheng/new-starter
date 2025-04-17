import { IMatchService } from '../types/match-service';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';

export class MatchServiceRegistry {
  private static instance: MatchServiceRegistry;
  private providers: Map<string, new (...args: any[]) => IMatchService> = new Map();

  private constructor() {
    this.registerProvider('mock', MockMatchServiceAdapter);
  }

  public static getInstance(): MatchServiceRegistry {
    if (!MatchServiceRegistry.instance) {
      MatchServiceRegistry.instance = new MatchServiceRegistry();
    }
    return MatchServiceRegistry.instance;
  }

  public getProvider(type: string): (new (...args: any[]) => IMatchService) | undefined {
    return this.providers.get(type);
  }

  public registerProvider(type: string, provider: new (...args: any[]) => IMatchService): void {
    this.providers.set(type, provider);
  }

  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }
}
