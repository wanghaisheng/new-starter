import { ISensorService, SensorType, SensorEvent, SensorData } from '../types/sensor-service';
import { createSensorService } from '../factory/sensor-service-factory';

export class SensorService implements ISensorService {
  private adapter: ISensorService;
  constructor(type?: 'web' | 'capacitor' | 'mock') {
    this.adapter = createSensorService(type);
  }
  async initialize() { await this.adapter.initialize(); }
  isInitialized() { return this.adapter.isInitialized(); }
  isAvailable(type: SensorType): boolean { return this.adapter.isAvailable(type); }
  async start(type: SensorType): Promise<boolean> { return this.adapter.start(type); }
  async stop(type: SensorType): Promise<boolean> { return this.adapter.stop(type); }
  on(event: SensorEvent, handler: (data: any) => void): void { this.adapter.on(event, handler); }
  off(event: SensorEvent, handler: (data: any) => void): void { this.adapter.off(event, handler); }
}
