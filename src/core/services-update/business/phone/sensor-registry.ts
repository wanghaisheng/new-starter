// 传感器服务注册表
import { ISensorService } from './sensor-service';

export class SensorRegistry {
  private static instance: SensorRegistry;
  private providers: Map<string, new () => ISensorService> = new Map();

  private constructor() {}

  static getInstance(): SensorRegistry {
    if (!SensorRegistry.instance) {
      SensorRegistry.instance = new SensorRegistry();
    }
    return SensorRegistry.instance;
  }

  registerProvider(type: string, provider: new () => ISensorService) {
    this.providers.set(type, provider);
  }

  unregisterProvider(type: string) {
    this.providers.delete(type);
  }

  create(type: string): ISensorService | undefined {
    const Provider = this.providers.get(type);
    return Provider ? new Provider() : undefined;
  }
}
