// 自动注册全部 phone 服务的最优实现（根据品牌/机型 UA 检测）
import { SensorRegistry } from './sensor-registry';
import { CameraRegistry } from './camera-registry';
import { BluetoothRegistry } from './bluetooth-registry';
import { NFCRegistry } from './nfc-registry';
import { LocationRegistry } from './location-registry';

import { SensorService, IPhoneSensorService, SamsungSensorService } from './sensor-service';
import { CameraService, IPhoneCameraService, SamsungCameraService } from './camera-service';
import { BluetoothService, IPhoneBluetoothService, SamsungBluetoothService } from './bluetooth-service';
import { NFCService, IPhoneNFCService, SamsungNFCService } from './nfc-service';
import { LocationService, IPhoneLocationService, SamsungLocationService } from './location-service';

export function autoRegisterPhoneServices() {
  const ua = navigator.userAgent;

  // 注册传感器服务
  if (/iPhone|iPad|iPod/i.test(ua)) {
    SensorRegistry.getInstance().registerProvider('default', IPhoneSensorService);
  } else if (/SM-|Samsung|Galaxy/i.test(ua)) {
    SensorRegistry.getInstance().registerProvider('default', SamsungSensorService);
  } else {
    SensorRegistry.getInstance().registerProvider('default', SensorService);
  }

  // 注册摄像头服务
  if (/iPhone|iPad|iPod/i.test(ua)) {
    CameraRegistry.getInstance().registerProvider('default', IPhoneCameraService);
  } else if (/SM-|Samsung|Galaxy/i.test(ua)) {
    CameraRegistry.getInstance().registerProvider('default', SamsungCameraService);
  } else {
    CameraRegistry.getInstance().registerProvider('default', CameraService);
  }

  // 注册蓝牙服务
  if (/iPhone|iPad|iPod/i.test(ua)) {
    BluetoothRegistry.getInstance().registerProvider('default', IPhoneBluetoothService);
  } else if (/SM-|Samsung|Galaxy/i.test(ua)) {
    BluetoothRegistry.getInstance().registerProvider('default', SamsungBluetoothService);
  } else {
    BluetoothRegistry.getInstance().registerProvider('default', BluetoothService);
  }

  // 注册 NFC 服务
  if (/iPhone|iPad|iPod/i.test(ua)) {
    NFCRegistry.getInstance().registerProvider('default', IPhoneNFCService);
  } else if (/SM-|Samsung|Galaxy/i.test(ua)) {
    NFCRegistry.getInstance().registerProvider('default', SamsungNFCService);
  } else {
    NFCRegistry.getInstance().registerProvider('default', NFCService);
  }

  // 注册定位服务
  if (/iPhone|iPad|iPod/i.test(ua)) {
    LocationRegistry.getInstance().registerProvider('default', IPhoneLocationService);
  } else if (/SM-|Samsung|Galaxy/i.test(ua)) {
    LocationRegistry.getInstance().registerProvider('default', SamsungLocationService);
  } else {
    LocationRegistry.getInstance().registerProvider('default', LocationService);
  }
}
