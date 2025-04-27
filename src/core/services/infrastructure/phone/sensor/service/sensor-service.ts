import type { ISensorService, SensorServiceType, SensorType, SensorEvent, SensorData } from '../types/sensor-service';
import { SensorServiceFactory } from '../factory/sensor-service-factory';

// 统一传感器服务实现，适配不同平台
export class SensorService implements ISensorService {
  private adapter: ISensorService;
  constructor(type: SensorServiceType = 'capacitor', options: Record<string, any> = {}) {
    this.adapter = SensorServiceFactory.getAdapter(type, options) ?? SensorServiceFactory.getAdapter('mock')!;
  }

  async initialize(): Promise<void> { await this.adapter.initialize(); }
  isInitialized(): boolean { return this.adapter.isInitialized(); }
  isAvailable(type: SensorType): boolean { return this.adapter.isAvailable(type); }
  async start(type: SensorType): Promise<boolean> { return this.adapter.start(type); }
  async stop(type: SensorType): Promise<boolean> { return this.adapter.stop(type); }
  on(event: string, handler: (data: any) => void): void { this.adapter.on(event, handler); }
  off(event: string, handler: (data: any) => void): void { this.adapter.off(event, handler); }
}
