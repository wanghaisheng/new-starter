// 远程动态配置 phone 服务品牌映射与热更新支持
import { SensorRegistry } from './sensor-registry';
import { CameraRegistry } from './camera-registry';
import { BluetoothRegistry } from './bluetooth-registry';
import { NFCRegistry } from './nfc-registry';
import { LocationRegistry } from './location-registry';

// 本地 fallback 实现（可引用本地实现映射）
import { PHONE_BRAND_RULES, PhoneBrandRule } from './phone-service-brandmap';

// 远程配置接口返回结构（示例）
export interface RemoteBrandRule {
  name: string;
  match: string; // 正则表达式字符串
  services: {
    sensor: string;
    camera: string;
    bluetooth: string;
    nfc: string;
    location: string;
  };
}

// 服务实现工厂映射（字符串 -> 构造函数）
import { SensorService, IPhoneSensorService, SamsungSensorService } from './sensor-service';
import { CameraService, IPhoneCameraService, SamsungCameraService } from './camera-service';
import { BluetoothService, IPhoneBluetoothService, SamsungBluetoothService } from './bluetooth-service';
import { NFCService, IPhoneNFCService, SamsungNFCService } from './nfc-service';
import { LocationService, IPhoneLocationService, SamsungLocationService } from './location-service';
import { HuaweiCameraService } from './huawei-camera-service';

const SERVICE_CLASS_MAP: Record<string, any> = {
  SensorService,
  IPhoneSensorService,
  SamsungSensorService,
  CameraService,
  IPhoneCameraService,
  SamsungCameraService,
  HuaweiCameraService,
  BluetoothService,
  IPhoneBluetoothService,
  SamsungBluetoothService,
  NFCService,
  IPhoneNFCService,
  SamsungNFCService,
  LocationService,
  IPhoneLocationService,
  SamsungLocationService
  // 可继续扩展其它品牌/服务类
};

// 拉取远程配置并动态注册服务
export async function fetchAndRegisterPhoneServices(remoteConfigUrl: string) {
  let rules: RemoteBrandRule[] = [];
  try {
    const resp = await fetch(remoteConfigUrl);
    rules = await resp.json();
  } catch (e) {
    // 远程失败 fallback 本地
    rules = PHONE_BRAND_RULES.map(r => ({
      name: r.name,
      match: r.match.toString().replace(/^\/(.*)\/[a-z]*$/, '$1'), // 简单转为字符串
      services: {
        sensor: r.services.sensor.name,
        camera: r.services.camera.name,
        bluetooth: r.services.bluetooth.name,
        nfc: r.services.nfc.name,
        location: r.services.location.name
      }
    }));
  }
  const ua = navigator.userAgent;
  let matchRule = rules.find(rule => {
    try {
      return new RegExp(rule.match, 'i').test(ua);
    } catch { return false; }
  }) || rules.find(r => r.name === 'default');

  if (!matchRule) return;

  // 动态注册各服务
  SensorRegistry.getInstance().registerProvider('default', SERVICE_CLASS_MAP[matchRule.services.sensor] || SensorService);
  CameraRegistry.getInstance().registerProvider('default', SERVICE_CLASS_MAP[matchRule.services.camera] || CameraService);
  BluetoothRegistry.getInstance().registerProvider('default', SERVICE_CLASS_MAP[matchRule.services.bluetooth] || BluetoothService);
  NFCRegistry.getInstance().registerProvider('default', SERVICE_CLASS_MAP[matchRule.services.nfc] || NFCService);
  LocationRegistry.getInstance().registerProvider('default', SERVICE_CLASS_MAP[matchRule.services.location] || LocationService);
}
