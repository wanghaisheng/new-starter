// 手机端各类能力业务调用示例
import { NFCService } from './nfc-service';
import { SensorFactory } from './sensor-factory';
import { BluetoothService } from './bluetooth-service';
import { CameraFactory } from './camera-factory';
import { LocationService } from './location-service';

// 1. NFC 录入门禁卡
export async function nfcEnrollAccessCard() {
  const nfc = new NFCService();
  await nfc.initialize();
  if (nfc.isAvailable()) {
    const tag = await nfc.readTag();
    console.log('门禁卡信息:', tag);
    // 业务逻辑：保存门禁卡信息到用户档案
  } else {
    console.warn('NFC 不可用');
  }
}

// 2. 获取手机机载传感器数据
export async function getPhoneSensorData() {
  const sensor = SensorFactory.create('default');
  await sensor.initialize();
  if (sensor.isAvailable()) {
    const data = await sensor.getSensorData();
    console.log('传感器数据:', data);
    // 业务逻辑：分析/展示传感器数据
  } else {
    console.warn('传感器不可用');
  }
}

// 3. 蓝牙耳机配对
export async function bluetoothPairHeadset() {
  const bluetooth = new BluetoothService();
  await bluetooth.initialize();
  if (bluetooth.isAvailable()) {
    const devices = await bluetooth.scanDevices();
    const headset = devices.find(d => d.name?.toLowerCase().includes('headset'));
    if (headset) {
      console.log('发现蓝牙耳机:', headset);
      // 业务逻辑：发起配对
    } else {
      console.warn('未发现蓝牙耳机');
    }
  } else {
    console.warn('蓝牙不可用');
  }
}

// 4. 获取摄像头权限并拍照
export async function takePhotoWithPermission() {
  const camera = CameraFactory.create('default');
  await camera.initialize();
  if (camera.isAvailable()) {
    const granted = await camera.requestPermissions();
    if (granted) {
      // 业务逻辑：拍照（此处仅演示权限申请，实际拍照需扩展 CameraService）
      console.log('已获得摄像头权限，可拍照');
    } else {
      console.warn('用户未授权摄像头');
    }
  } else {
    console.warn('摄像头不可用');
  }
}

// 5. 基于定位的交友推荐
export async function locationBasedFriendDiscovery() {
  const location = new LocationService();
  await location.initialize();
  if (location.isAvailable()) {
    const { lat, lng } = await location.getCurrentLocation();
    console.log('当前位置:', lat, lng);
    // 业务逻辑：调用后端/服务获取附近的好友或推荐用户
    // const friends = await fetchNearbyFriends(lat, lng);
    // console.log('附近的好友:', friends);
  } else {
    console.warn('定位服务不可用');
  }
}

// 6. UI 触发用户授权各种权限的示例
// 假设在前端（如 React/Vue）中调用这些方法
export async function requestAllPhonePermissions() {
  // 摄像头权限
  const camera = CameraFactory.create('default');
  await camera.initialize();
  const cameraGranted = await camera.requestPermissions();
  alert('摄像头权限: ' + (cameraGranted ? '已授权' : '未授权'));

  // 传感器权限（如有）
  const sensor = SensorFactory.create('default');
  await sensor.initialize();
  // 假设有 requestPermissions 方法
  if ('requestPermissions' in sensor) {
    // @ts-ignore
    const sensorGranted = await sensor.requestPermissions();
    alert('传感器权限: ' + (sensorGranted ? '已授权' : '未授权'));
  }

  // 定位权限
  const location = new LocationService();
  await location.initialize();
  if ('requestPermissions' in location) {
    // @ts-ignore
    const locationGranted = await location.requestPermissions();
    alert('定位权限: ' + (locationGranted ? '已授权' : '未授权'));
  }

  // 蓝牙权限（如有）
  const bluetooth = new BluetoothService();
  await bluetooth.initialize();
  if ('requestPermissions' in bluetooth) {
    // @ts-ignore
    const bluetoothGranted = await bluetooth.requestPermissions();
    alert('蓝牙权限: ' + (bluetoothGranted ? '已授权' : '未授权'));
  }

  // NFC 权限（如有）
  const nfc = new NFCService();
  await nfc.initialize();
  if ('requestPermissions' in nfc) {
    // @ts-ignore
    const nfcGranted = await nfc.requestPermissions();
    alert('NFC权限: ' + (nfcGranted ? '已授权' : '未授权'));
  }
}

// UI 端按钮示例（伪代码）
// <button onclick="requestAllPhonePermissions()">一键申请所有权限</button>
