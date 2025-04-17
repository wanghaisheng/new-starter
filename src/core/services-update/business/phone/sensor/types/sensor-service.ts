// 传感器服务统一接口与类型定义

// iPhone/iOS 设备可用的主流传感器类型
export type SensorType =
  | 'accelerometer'        // 加速度
  | 'gyroscope'            // 陀螺仪
  | 'magnetometer'         // 磁力计（指南针）
  | 'light'                // 环境光（部分机型支持，iOS 13+ Safari 暂无原生API）
  | 'proximity'            // 距离传感器（仅通话时，API极为有限）
  | 'orientation'          // 方向（DeviceOrientationEvent）
  | 'stepCounter'          // 计步（通过 CoreMotion，Web 暂无原生API）
  | 'custom';

export type SensorData = {
  type: SensorType;
  timestamp: number;
  values: Record<string, number>;
};

export type SensorEvent = 'data' | 'error' | 'activated' | 'deactivated';

export interface ISensorService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  isAvailable(type: SensorType): boolean;
  start(type: SensorType): Promise<boolean>;
  stop(type: SensorType): Promise<boolean>;
  on(event: SensorEvent, handler: (data: any) => void): void;
  off(event: SensorEvent, handler: (data: any) => void): void;
}
