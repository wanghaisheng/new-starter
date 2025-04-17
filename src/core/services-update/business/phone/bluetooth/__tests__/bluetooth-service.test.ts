import { BluetoothService } from '../service/bluetooth-service';
import { BluetoothDevice } from '../types/bluetooth-service';

describe('BluetoothService', () => {
  let service: BluetoothService;

  beforeEach(() => {
    service = new BluetoothService('mock');
  });

  it('should initialize', async () => {
    await service.initialize();
    expect(service.isInitialized()).toBe(true);
  });

  it('should request permissions', async () => {
    const granted = await service.requestPermissions();
    expect(granted).toBe(true);
  });

  it('should scan mock devices', async () => {
    const devices = await service.scanDevices();
    expect(Array.isArray(devices)).toBe(true);
    expect(devices[0]?.id).toBe('mock');
  });

  it('should support connect/disconnect and event listeners', async () => {
    const device: BluetoothDevice = { id: 'mock', name: 'Mock Device' };
    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    service.on('deviceConnected', onConnect);
    service.on('deviceDisconnected', onDisconnect);
    await service.connect(device.id);
    await service.disconnect(device.id);
    expect(onConnect).toHaveBeenCalled();
    expect(onDisconnect).toHaveBeenCalled();
    service.off('deviceConnected', onConnect);
    service.off('deviceDisconnected', onDisconnect);
  });
});
