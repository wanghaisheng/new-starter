import { BluetoothService } from '../service/bluetooth-service';

describe('BluetoothService Advanced', () => {
  let service: BluetoothService;
  beforeEach(() => {
    service = new BluetoothService('mock');
  });

  it('should connect with options and receive notify data', async done => {
    const onData = jest.fn((payload) => {
      expect(payload.deviceId).toBe('mock');
      expect(payload.serviceUUID).toBe('service1');
      expect(payload.characteristicUUID).toBe('char1');
      expect(payload.value).toBeInstanceOf(Uint8Array);
      done();
    });
    service.on('dataReceived', onData);
    await service.connect('mock', {
      serviceUUIDs: ['service1'],
      characteristicUUIDs: ['char1'],
    });
  });

  it('should write and trigger dataReceived', async done => {
    const onData = jest.fn((payload) => {
      expect(payload.deviceId).toBe('mock');
      expect(payload.serviceUUID).toBe('service1');
      expect(payload.characteristicUUID).toBe('char1');
      expect(new Uint8Array([1,2,3]).toString()).toBe(payload.value.toString());
      done();
    });
    service.on('dataReceived', onData);
    await service.connect('mock', { serviceUUIDs: ['service1'], characteristicUUIDs: ['char1'] });
    await service.write('mock', 'service1', 'char1', new Uint8Array([1,2,3]));
  });

  it('should support multi-device connect/disconnect', async () => {
    const service2 = new BluetoothService('mock');
    await service.connect('mock1');
    await service2.connect('mock2');
    expect(await service.disconnect('mock1')).toBe(true);
    expect(await service2.disconnect('mock2')).toBe(true);
  });

  it('should remove event handler with off()', async () => {
    const onData = jest.fn();
    service.on('dataReceived', onData);
    service.off('dataReceived', onData);
    await service.connect('mock');
    await service.write('mock', 'service1', 'char1', new Uint8Array([1,2,3]));
    expect(onData).not.toHaveBeenCalled();
  });
});
