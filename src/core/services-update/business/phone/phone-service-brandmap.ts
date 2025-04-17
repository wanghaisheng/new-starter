// 品牌/机型与服务实现映射与自动注册（可扩展配置化与自定义品牌支持）

/**
 * 品牌/机型识别规则及服务实现映射
 * 可按需扩展更多品牌、机型、甚至系统版本
 */
export interface PhoneBrandRule {
  name: string;
  match: (ua: string) => boolean;
  services: {
    sensor: any;
    camera: any;
    bluetooth: any;
    nfc: any;
    location: any;
  };
}

import { SensorService, IPhoneSensorService, SamsungSensorService } from './sensor-service';
import { CameraService, IPhoneCameraService, SamsungCameraService } from './camera-service';
import { BluetoothService, IPhoneBluetoothService, SamsungBluetoothService } from './bluetooth-service';
import { NFCService, IPhoneNFCService, SamsungNFCService } from './nfc-service';
import { LocationService, IPhoneLocationService, SamsungLocationService } from './location-service';

export const PHONE_BRAND_RULES: PhoneBrandRule[] = [
  {
    name: 'iPhone',
    match: ua => /iPhone|iPad|iPod/i.test(ua),
    services: {
      sensor: IPhoneSensorService,
      camera: IPhoneCameraService,
      bluetooth: IPhoneBluetoothService,
      nfc: IPhoneNFCService,
      location: IPhoneLocationService
    }
  },
  {
    name: 'Samsung',
    match: ua => /SM-|Samsung|Galaxy/i.test(ua),
    services: {
      sensor: SamsungSensorService,
      camera: SamsungCameraService,
      bluetooth: SamsungBluetoothService,
      nfc: SamsungNFCService,
      location: SamsungLocationService
    }
  },
  // 可继续添加更多品牌/机型
  {
    name: 'Huawei',
    match: ua => /HUAWEI|HONOR|EML-|CLT-|LYA-|ELE-|VOG-|HUAWEI|HW-/i.test(ua),
    services: {
      sensor: SensorService, // 可扩展 HuaweiSensorService
      camera: CameraService, // 可扩展 HuaweiCameraService
      bluetooth: BluetoothService, // 可扩展 HuaweiBluetoothService
      nfc: NFCService, // 可扩展 HuaweiNFCService
      location: LocationService // 可扩展 HuaweiLocationService
    }
  },
  {
    name: 'Xiaomi',
    match: ua => /MIUI|XiaoMi|Redmi|MIX|MI |M2011K2C|M2102K1C/i.test(ua),
    services: {
      sensor: SensorService, // 可扩展 XiaomiSensorService
      camera: CameraService, // 可扩展 XiaomiCameraService
      bluetooth: BluetoothService, // 可扩展 XiaomiBluetoothService
      nfc: NFCService, // 可扩展 XiaomiNFCService
      location: LocationService // 可扩展 XiaomiLocationService
    }
  },
  {
    name: 'OPPO',
    match: ua => /OPPO|CPH|PCLM/i.test(ua),
    services: {
      sensor: SensorService, // 可扩展 OPPOSensorService
      camera: CameraService, // 可扩展 OPPOCameraService
      bluetooth: BluetoothService, // 可扩展 OPPOBluetoothService
      nfc: NFCService, // 可扩展 OPPONFCService
      location: LocationService // 可扩展 OPPOLocationService
    }
  },
  {
    name: 'VIVO',
    match: ua => /VIVO|PD|V1|V2|V3|V5|V7|V9|V11|V15|V17|V19|V20|V21|V23|V25|V27|V29/i.test(ua),
    services: {
      sensor: SensorService, // 可扩展 VIVOSensorService
      camera: CameraService, // 可扩展 VIVOCameraService
      bluetooth: BluetoothService, // 可扩展 VIVOBluetoothService
      nfc: NFCService, // 可扩展 VIVONFCService
      location: LocationService // 可扩展 VIVOLocationService
    }
  },
  {
    name: 'Pixel',
    match: ua => /Pixel/i.test(ua),
    services: {
      sensor: SensorService, // 可扩展 PixelSensorService
      camera: CameraService, // 可扩展 PixelCameraService
      bluetooth: BluetoothService, // 可扩展 PixelBluetoothService
      nfc: NFCService, // 可扩展 PixelNFCService
      location: LocationService // 可扩展 PixelLocationService
    }
  },
  {
    name: 'default',
    match: _ => true,
    services: {
      sensor: SensorService,
      camera: CameraService,
      bluetooth: BluetoothService,
      nfc: NFCService,
      location: LocationService
    }
  }
];

// 自动注册所有服务，支持扩展、配置化
import { SensorRegistry } from './sensor-registry';
import { CameraRegistry } from './camera-registry';
import { BluetoothRegistry } from './bluetooth-registry';
import { NFCRegistry } from './nfc-registry';
import { LocationRegistry } from './location-registry';

export function autoRegisterPhoneServicesByBrand() {
  const ua = navigator.userAgent;
  const rule = PHONE_BRAND_RULES.find(r => r.match(ua)) || PHONE_BRAND_RULES[PHONE_BRAND_RULES.length - 1];
  SensorRegistry.getInstance().registerProvider('default', rule.services.sensor);
  CameraRegistry.getInstance().registerProvider('default', rule.services.camera);
  BluetoothRegistry.getInstance().registerProvider('default', rule.services.bluetooth);
  NFCRegistry.getInstance().registerProvider('default', rule.services.nfc);
  LocationRegistry.getInstance().registerProvider('default', rule.services.location);
}
