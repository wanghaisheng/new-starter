# 设备服务设计指南

## 概述

设备服务是 HeyTCM 的核心组件之一，采用适配器模式设计，实现了业务逻辑与具体设备实现的解耦。这种设计带来以下核心优势：

1. **统一的设备接口**
   - 所有设备类型（传感器、蓝牙、网络）使用相同的服务接口
   - 业务代码无需关心具体实现
   - 保持接口一致性

2. **灵活的设备支持**
   - 支持多种传感器类型
   - 支持多种蓝牙设备
   - 支持多种网络设备

3. **统一的配置管理**
   - 集中管理设备配置
   - 环境感知配置
   - 设备状态管理

4. **性能优化**
   - 数据采样控制
   - 数据缓存
   - 同步策略
   - 资源管理

## 架构设计

### 核心组件

1. **设备服务接口 (IDeviceService)**
   - 定义设备服务的基本行为
   - 包含各种设备能力的方法
   - 所有设备服务必须实现此接口

2. **设备服务适配器**
   - 实现特定设备服务的具体逻辑
   - 支持多种实现方式：
     - 传感器适配器：用于传感器数据采集
     - 蓝牙适配器：用于蓝牙设备连接
     - 网络适配器：用于网络设备管理

3. **设备服务工厂**
   - 负责创建设备服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **设备服务注册表**
   - 管理设备服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 目录结构

```
src/core/services/device/
├── types/               # 设备服务类型
│   ├── device-service.ts  # 设备服务接口
│   ├── sensor.ts         # 传感器类型
│   ├── bluetooth.ts      # 蓝牙设备类型
│   ├── health.ts         # 健康数据类型
│   └── network.ts        # 网络设备类型
├── adapters/            # 设备服务适配器
│   ├── sensor/          # 传感器适配器
│   │   ├── motion/      # 运动传感器
│   │   │   ├── accelerometer.ts    # 加速度计
│   │   │   ├── gyroscope.ts        # 陀螺仪
│   │   │   └── orientation.ts      # 方向传感器
│   │   ├── environment/ # 环境传感器
│   │   │   ├── ambient-light.ts    # 环境光
│   │   │   ├── temperature.ts      # 温度
│   │   │   └── humidity.ts         # 湿度
│   │   └── health/      # 健康传感器
│   │       ├── heart-rate.ts       # 心率
│   │       ├── pedometer.ts        # 计步器
│   │       └── sleep.ts            # 睡眠监测
│   ├── bluetooth/       # 蓝牙适配器
│   │   ├── smart-watch/ # 智能手表
│   │   │   ├── apple-watch.ts      # Apple Watch
│   │   │   ├── galaxy-watch.ts     # Galaxy Watch
│   │   │   └── fitbit.ts           # Fitbit
│   │   ├── health-monitor/ # 健康监测设备
│   │   │   ├── blood-pressure.ts   # 血压计
│   │   │   ├── glucose-meter.ts    # 血糖仪
│   │   │   └── oximeter.ts         # 血氧仪
│   │   └── fitness/     # 健身设备
│   │       ├── treadmill.ts        # 跑步机
│   │       ├── bike.ts             # 动感单车
│   │       └── scale.ts            # 智能体重秤
│   └── network/         # 网络设备适配器
│       ├── cellular/    # 蜂窝网络设备
│       │   ├── smart-band.ts       # 智能手环
│       │   ├── smart-clothing.ts   # 智能服装
│       │   └── medical-device.ts   # 医疗设备
│       └── wifi/        # WiFi设备
│           ├── smart-scale.ts      # 智能体重秤
│           ├── smart-pillbox.ts    # 智能药盒
│           └── smart-thermometer.ts # 智能体温计
└── providers/           # 设备服务提供者
    ├── sensor-provider.ts    # 传感器提供者
    ├── bluetooth-provider.ts # 蓝牙提供者
    └── network-provider.ts   # 网络提供者
```

### 配置示例

```typescript
{
  "device": {
    "type": "hybrid",
    "sensors": {
      "enabled": true,
      "types": ["motion", "environment", "health"],
      "samplingRate": {
        "motion": 100, // Hz
        "environment": 1, // Hz
        "health": 1 // Hz
      }
    },
    "bluetooth": {
      "enabled": true,
      "devices": {
        "smartWatch": {
          "type": "apple-watch",
          "services": ["heart-rate", "activity", "sleep"],
          "syncInterval": 300 // seconds
        },
        "healthMonitor": {
          "type": "blood-pressure",
          "services": ["measurement", "history"],
          "syncInterval": 3600 // seconds
        }
      }
    },
    "network": {
      "enabled": true,
      "devices": {
        "smartBand": {
          "type": "cellular",
          "services": ["activity", "sleep", "location"],
          "syncInterval": 600 // seconds
        },
        "medicalDevice": {
          "type": "cellular",
          "services": ["vital-signs", "alerts"],
          "syncInterval": 300 // seconds
        }
      }
    }
  }
}
```

### 接口定义

```typescript
interface IDeviceService {
  // 传感器管理
  enableSensor(type: SensorType): Promise<void>;
  disableSensor(type: SensorType): Promise<void>;
  getSensorData(type: SensorType): Promise<SensorData>;
  
  // 蓝牙设备管理
  scanBluetoothDevices(): Promise<BluetoothDevice[]>;
  connectDevice(deviceId: string): Promise<void>;
  disconnectDevice(deviceId: string): Promise<void>;
  getDeviceData(deviceId: string): Promise<DeviceData>;
  
  // 网络设备管理
  registerNetworkDevice(device: NetworkDevice): Promise<void>;
  unregisterNetworkDevice(deviceId: string): Promise<void>;
  getNetworkDeviceData(deviceId: string): Promise<DeviceData>;
  
  // 数据同步
  syncDeviceData(): Promise<void>;
  getHistoricalData(options: DataQueryOptions): Promise<HistoricalData[]>;
}

// 健康数据类型
interface HealthData {
  timestamp: Date;
  type: 'heart-rate' | 'blood-pressure' | 'glucose' | 'activity' | 'sleep';
  value: number;
  unit: string;
  deviceId: string;
  deviceType: string;
  metadata?: Record<string, any>;
}

// 设备同步状态
interface DeviceSyncStatus {
  deviceId: string;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  error?: string;
}
```

## 实现建议

### 1. 传感器数据采集

1. **数据采样控制**
   - 实现采样率配置
   - 处理数据缓存
   - 优化电池使用
   - 处理权限请求

2. **数据处理**
   - 数据验证
   - 数据过滤
   - 数据聚合
   - 异常检测

3. **数据存储**
   - 本地缓存
   - 数据同步
   - 历史记录
   - 数据导出

### 2. 蓝牙设备管理

1. **设备发现**
   - 自动扫描
   - 设备过滤
   - 连接管理
   - 错误处理

2. **数据同步**
   - 实时数据
   - 历史数据
   - 批量同步
   - 冲突解决

3. **设备状态**
   - 连接状态
   - 电池状态
   - 信号强度
   - 错误处理

### 3. 网络设备集成

1. **设备注册**
   - 设备认证
   - 配置管理
   - 状态监控
   - 错误处理

2. **数据同步**
   - 实时数据
   - 批量同步
   - 断点续传
   - 数据压缩

3. **网络管理**
   - 网络切换
   - 离线存储
   - 自动重连
   - 错误恢复

### 4. 健康数据管理

1. **数据标准化**
   - 格式统一
   - 单位转换
   - 数据验证
   - 异常处理

2. **数据分析**
   - 趋势分析
   - 异常检测
   - 健康评估
   - 报告生成

3. **数据隐私**
   - 数据加密
   - 访问控制
   - 数据清理
   - 合规性

## 最佳实践

1. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

2. **日志记录**
   - 设备日志
   - 数据日志
   - 错误日志
   - 性能日志

3. **监控告警**
   - 设备监控
   - 数据监控
   - 性能监控
   - 错误监控

4. **测试策略**
   - 设备测试
   - 数据测试
   - 性能测试
   - 安全测试

## 示例

### 创建设备服务实例

```typescript
const config: DeviceConfig = {
  type: 'hybrid',
  sensors: {
    enabled: true,
    types: ['motion', 'environment', 'health'],
    samplingRate: {
      motion: 100,
      environment: 1,
      health: 1
    }
  }
};

const factory = DeviceServiceFactory.getInstance();
const service = factory.createService(config);
```

### 使用设备服务

```typescript
// 启用传感器
await service.enableSensor('heart-rate');

// 获取传感器数据
const heartRate = await service.getSensorData('heart-rate');

// 扫描蓝牙设备
const devices = await service.scanBluetoothDevices();

// 连接设备
await service.connectDevice(devices[0].id);

// 获取设备数据
const data = await service.getDeviceData(devices[0].id);

// 同步数据
await service.syncDeviceData();
```

## 注意事项

1. **配置管理**
   - 使用环境变量
   - 避免硬编码
   - 保护敏感信息
   - 版本控制

2. **资源管理**
   - 及时释放资源
   - 处理连接池
   - 监控资源使用
   - 优化资源分配

3. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

4. **性能优化**
   - 数据采样控制
   - 数据缓存
   - 同步策略
   - 资源管理 