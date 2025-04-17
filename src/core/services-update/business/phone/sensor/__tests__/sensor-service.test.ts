import { SensorService } from '../service/sensor-service';
import { SensorType } from '../types/sensor-service';

describe('SensorService (mock)', () => {
  let service: SensorService;
  beforeEach(() => {
    service = new SensorService('mock');
  });

  it('should initialize and report as initialized', async () => {
    expect(service.isInitialized()).toBe(false);
    await service.initialize();
    expect(service.isInitialized()).toBe(true);
  });

  it('should activate and receive sensor data', done => {
    const onData = jest.fn((data) => {
      expect(data.type).toBe('accelerometer');
      expect(typeof data.values.x).toBe('number');
      service.stop('accelerometer');
      done();
    });
    service.on('data', onData);
    service.start('accelerometer');
  });

  it('should support multiple sensor types', done => {
    let count = 0;
    const onData = jest.fn((data) => {
      if (data.type === 'gyroscope') count++;
      if (count > 2) {
        service.stop('gyroscope');
        done();
      }
    });
    service.on('data', onData);
    service.start('gyroscope');
  });

  it('should emit activated and deactivated events', done => {
    let activated = false, deactivated = false;
    service.on('activated', (e) => { activated = true; });
    service.on('deactivated', (e) => { deactivated = true; });
    service.start('magnetometer').then(() => {
      service.stop('magnetometer').then(() => {
        expect(activated).toBe(true);
        expect(deactivated).toBe(true);
        done();
      });
    });
  });

  it('should remove event handler with off()', done => {
    const onData = jest.fn();
    service.on('data', onData);
    service.off('data', onData);
    service.start('light');
    setTimeout(() => {
      expect(onData).not.toHaveBeenCalled();
      service.stop('light');
      done();
    }, 200);
  });
});
