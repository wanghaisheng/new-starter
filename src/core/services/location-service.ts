import { Geolocation } from '@capacitor/geolocation';
import { Platform } from '@ionic/core';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface LocationError {
  code: string;
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 请求位置权限
      await Geolocation.requestPermissions();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing location service:', error);
      throw new Error('Failed to initialize location service');
    }
  }

  public async getCurrentPosition(): Promise<Location> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        altitude: coordinates.coords.altitude,
        altitudeAccuracy: coordinates.coords.altitudeAccuracy,
        heading: coordinates.coords.heading,
        speed: coordinates.coords.speed,
        timestamp: coordinates.timestamp
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      throw this.handleLocationError(error);
    }
  }

  public async watchPosition(
    callback: (location: Location) => void,
    options: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    } = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const watchId = await Geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('Error in watch position:', error);
          this.handleLocationError(error);
        },
        options
      );

      return watchId;
    } catch (error) {
      console.error('Error starting position watch:', error);
      throw this.handleLocationError(error);
    }
  }

  public async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing position watch:', error);
      throw new Error('Failed to clear position watch');
    }
  }

  private handleLocationError(error: any): LocationError {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';

    if (error.code) {
      switch (error.code) {
        case 1:
          code = 'PERMISSION_DENIED';
          message = 'Location permission denied';
          break;
        case 2:
          code = 'POSITION_UNAVAILABLE';
          message = 'Location information unavailable';
          break;
        case 3:
          code = 'TIMEOUT';
          message = 'Location request timed out';
          break;
        default:
          code = `ERROR_${error.code}`;
          message = error.message || message;
      }
    }

    return { code, message };
  }

  public async calculateDistance(
    point1: Location,
    point2: Location
  ): Promise<number> {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 返回距离（米）
  }
} 