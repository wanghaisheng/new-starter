/**
 * 同步标志类型
 * 定义用于离线存储和跨环境同步的标志
 */

// 同步状态枚举
export enum SyncState {
  /**
   * 新建本地，未同步到远程
   */
  NEW = 'new',
  
  /**
   * 本地修改，未同步到远程
   */
  MODIFIED = 'modified',
  
  /**
   * 本地删除，未从远程删除
   */
  DELETED = 'deleted',
  
  /**
   * 已同步，本地和远程相同
   */
  SYNCED = 'synced',
  
  /**
   * 同步冲突，需要解决
   */
  CONFLICT = 'conflict',
  
  /**
   * 同步失败，需要重试
   */
  FAILED = 'failed'
}

// 同步优先级枚举
export enum SyncPriority {
  /**
   * 高优先级，立即同步
   */
  HIGH = 'high',
  
  /**
   * 中等优先级，正常同步周期
   */
  MEDIUM = 'medium',
  
  /**
   * 低优先级，空闲时同步
   */
  LOW = 'low',
  
  /**
   * 手动同步，仅在用户请求时同步
   */
  MANUAL = 'manual'
}

// 同步冲突解决策略枚举
export enum ConflictResolution {
  /**
   * 客户端优先，保留本地修改
   */
  CLIENT_WINS = 'client_wins',
  
  /**
   * 服务器优先，使用远程数据
   */
  SERVER_WINS = 'server_wins',
  
  /**
   * 合并修改，尝试合并数据
   */
  MERGE = 'merge',
  
  /**
   * 手动解决，提示用户选择
   */
  MANUAL = 'manual'
}

/**
 * 同步元数据接口
 * 应用于需要离线存储和远程同步的实体
 */
export interface SyncMetadata {
  /**
   * 同步状态
   */
  syncState: SyncState;
  
  /**
   * 上次同步时间
   */
  lastSyncedAt?: Date;
  
  /**
   * 本地修改时间
   */
  localModifiedAt: Date;
  
  /**
   * 远程修改时间
   */
  remoteModifiedAt?: Date;
  
  /**
   * 同步尝试次数
   */
  syncAttempts?: number;
  
  /**
   * 同步优先级
   */
  syncPriority: SyncPriority;
  
  /**
   * 版本标识符（用于乐观锁）
   */
  version?: number | string;
  
  /**
   * 冲突解决策略
   */
  conflictResolution?: ConflictResolution;
  
  /**
   * 设备ID（用于多设备同步）
   */
  deviceId?: string;
  
  /**
   * 额外同步元数据（根据具体环境需要）
   */
  meta?: Record<string, any>;
}

/**
 * 同步配置接口
 * 用于配置实体表的同步行为
 */
export interface SyncConfig {
  /**
   * 是否启用同步
   */
  enabled: boolean;
  
  /**
   * 是否仅存储在离线环境
   * 如果为true，数据将永远不会被同步到云端
   */
  offlineOnly?: boolean;
  
  /**
   * 默认同步优先级
   */
  defaultPriority: SyncPriority;
  
  /**
   * 默认冲突解决策略
   */
  defaultConflictResolution: ConflictResolution;
  
  /**
   * 同步间隔（毫秒）
   */
  syncInterval?: number;
  
  /**
   * 最大同步重试次数
   */
  maxRetries?: number;
  
  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;
  
  /**
   * 批量同步大小
   */
  batchSize?: number;
  
  /**
   * 删除后保留（毫秒）
   * 控制删除标记的数据在本地保留多久
   */
  retentionAfterDelete?: number;
}

/**
 * 可同步实体接口
 * 用于扩展基础实体，添加同步功能
 */
export interface SyncableEntity {
  /**
   * 同步元数据
   */
  _sync?: SyncMetadata;
} 