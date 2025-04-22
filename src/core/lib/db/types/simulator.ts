export interface NetworkConditions {
  latency: number;      // 网络延迟（毫秒）
  jitter: number;       // 网络抖动（毫秒）
  bandwidth: number;    // 带宽（KB/s�?
  packetLoss: number;   // 丢包率（0-1�?
}

export interface ResourceMetrics {
  memory: NodeJS.MemoryUsage;
  cpu: number;          // CPU使用率（0-100�?
  network: number;      // 网络使用率（0-100�?
  storage: number;      // 存储使用率（0-100�?
}

export interface UserSession {
  userId: string;
  deviceId: string;
  isActive: boolean;
  lastActive: Date;
  permissions: string[];
}

export interface DeviceState {
  deviceId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface Request {
  id: string;
  type: 'read' | 'write' | 'update' | 'delete';
  data?: any;
  timestamp: Date;
}

export interface BatchOperation {
  operations: Request[];
  timestamp: Date;
} 
