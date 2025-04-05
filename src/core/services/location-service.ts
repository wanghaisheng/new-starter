import { Capacitor } from '@capacitor/core';
import { Geolocation, GeolocationPosition, PositionOptions } from '@capacitor/geolocation';

import { BaseEntity } from '@/core/lib/db/types/base-entity';

import { OfflineStorageService } from './offline-storage-service';

// Define a type alias for cleaner code
type Position = GeolocationPosition;
type CallbackID = string;

/**
 * 位置记录接口，用于离线存储
 */
interface LocationRecord extends BaseEntity {
  timestamp: string;
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
}

export interface ILocationService {
  initialize(): Promise<void>;
  getCurrentPosition(options?: PositionOptions): Promise<Position>;
  watchPosition(options: PositionOptions, callback: (position: Position) => void): Promise<CallbackID>;
  clearWatch(watchId: CallbackID): Promise<void>;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  requestPermissions(): Promise<any>;
  checkPermissions(): Promise<any>;
  saveRecentLocation(position: Position): Promise<void>;
  getRecentLocations(limit?: number): Promise<Position[]>;
}

/**
 * 位置服务
 * 提供地理位置相关功能，如获取当前位置、监听位置变化等
 */
export class LocationService implements ILocationService {
  private static instance: LocationService;
  private offlineStorage: OfflineStorageService;
  private initialized: boolean = false;
  private watchCallbacks: Map<string, (position: Position) => void> = new Map();
  
  private constructor() {
    this.offlineStorage = OfflineStorageService.getInstance();
  }

  /**
   * 获取 LocationService 的单例
   * @returns LocationService 实例
   */
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 初始化位置服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.offlineStorage.initialize();
      
      // 确保离线表已创建
      try {
        const isTableOffline = await this.offlineStorage.isOfflineOnlyTable('recentLocations');
        if (!isTableOffline) {
          console.log('Creating offline-only table for recent locations');
          // 创建离线表的逻辑，如果需要
        }
      } catch (e) {
        console.warn('Table check failed, the table may not exist yet:', e);
        // 表可能还不存在，暂不处理
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize LocationService:', error);
      throw new Error('Failed to initialize LocationService');
    }
  }

  /**
   * 获取当前位置
   * @param options 位置选项
   * @returns 位置信息
   */
  public async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    await this.ensureInitialized();
    
    try {
      const position = await Geolocation.getCurrentPosition(options);
      
      // 保存位置到离线存储
      await this.saveRecentLocation(position);
      
      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      
      // 在离线情况下，尝试返回最近的位置
      const recentLocations = await this.getRecentLocations(1);
      if (recentLocations.length > 0) {
        return recentLocations[0];
      }
      
      throw new Error('Failed to get location and no cached location available');
    }
  }

  /**
   * 监听位置变化
   * @param options 监听选项
   * @param callback 位置变化回调
   * @returns 监听ID
   */
  public async watchPosition(
    options: PositionOptions,
    callback: (position: Position) => void
  ): Promise<CallbackID> {
    await this.ensureInitialized();
    
    try {
      // 保存回调以供稍后使用
      const watchId = await Geolocation.watchPosition(options, (position) => {
        if (position !== null) {
          // 调用原始回调
          callback(position);
          
          // 保存位置到离线存储
          this.saveRecentLocation(position).catch(err => {
            console.error('Error saving location during watch:', err);
          });
        }
      });
      
      this.watchCallbacks.set(watchId, callback);
      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      throw new Error('Failed to watch position');
    }
  }

  /**
   * 停止监听位置变化
   * @param watchId 监听ID
   */
  public async clearWatch(watchId: CallbackID): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await Geolocation.clearWatch({ id: watchId });
      this.watchCallbacks.delete(watchId);
    } catch (error) {
      console.error('Error clearing watch:', error);
      throw new Error('Failed to clear watch');
    }
  }

  /**
   * 计算两个地理位置之间的距离（公里）
   * 使用Haversine公式计算球面上两点间的距离
   * @param lat1 第一个位置的纬度
   * @param lon1 第一个位置的经度
   * @param lat2 第二个位置的纬度
   * @param lon2 第二个位置的经度
   * @returns 距离（公里）
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // 地球半径，单位为公里
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // 距离，单位为公里
    return d;
  }

  /**
   * 请求位置权限
   * @returns 权限状态
   */
  public async requestPermissions(): Promise<any> {
    return await Geolocation.requestPermissions();
  }

  /**
   * 检查位置权限
   * @returns 权限状态
   */
  public async checkPermissions(): Promise<any> {
    return await Geolocation.checkPermissions();
  }

  /**
   * 保存最近位置到离线存储
   * @param position 位置信息
   */
  public async saveRecentLocation(position: Position): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const timestamp = new Date().toISOString();
      const locationEntry: LocationRecord = {
        id: `loc_${timestamp}`,
        timestamp,
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.offlineStorage.create('recentLocations', locationEntry);
      
      // 限制存储的位置数量，保留最新的50个
      const allLocations = await this.getRecentLocations();
      if (allLocations.length > 50) {
        // 按时间排序
        allLocations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // 删除旧的位置
        for (let i = 50; i < allLocations.length; i++) {
          const oldLocationId = `loc_${allLocations[i].timestamp}`;
          await this.offlineStorage.delete('recentLocations', oldLocationId);
        }
      }
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  }

  /**
   * 获取最近位置历史
   * @param limit 限制返回的位置数量
   * @returns 位置列表
   */
  public async getRecentLocations(limit?: number): Promise<Position[]> {
    await this.ensureInitialized();
    
    try {
      // 获取所有位置记录
      const locationRecords = await this.offlineStorage.getAll<LocationRecord>('recentLocations');
      
      // 将存储的位置转换为Position对象
      const positions = locationRecords.map(loc => ({
        coords: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy || 0,  // Use 0 as default for missing values
          altitude: loc.coords.altitude || null,
          altitudeAccuracy: loc.coords.altitudeAccuracy || null,
          heading: loc.coords.heading || null,
          speed: loc.coords.speed || null
        },
        timestamp: new Date(loc.timestamp).getTime()
      } as Position));
      
      // 按时间倒序排序
      positions.sort((a, b) => b.timestamp - a.timestamp);
      
      // 限制返回的数量
      if (limit && limit > 0) {
        return positions.slice(0, limit);
      }
      
      return positions;
    } catch (error) {
      console.error('Error getting recent locations:', error);
      return [];
    }
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 将角度转换为弧度
   * @param deg 角度
   * @returns 弧度
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
} 