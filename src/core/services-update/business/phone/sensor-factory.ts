// 传感器服务工厂
import { ISensorService, SensorService, MockSensorService } from './sensor-service';

export type SensorServiceType = 'default' | 'mock';

export class SensorFactory {
  static create(type: SensorServiceType = 'default'): ISensorService {
    switch (type) {
      case 'mock':
        return new MockSensorService();
      case 'default':
      default:
        return new SensorService();
    }
  }
}
