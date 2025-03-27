import { Geolocation, Position } from '@capacitor/geolocation';
import { isPlatform } from '@ionic/react';

export class GeolocationService {
  private static instance: GeolocationService;
  
  private constructor() {}
  
  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }
  
  async getCurrentPosition(): Promise<Position | null> {
    if (!isPlatform('capacitor')) {
      console.warn('Geolocation is only available on native platforms');
      return null;
    }
    
    try {
      return await Geolocation.getCurrentPosition();
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }
  
  async watchPosition(callback: (position: Position) => void) {
    if (!isPlatform('capacitor')) {
      console.warn('Geolocation is only available on native platforms');
      return;
    }
    
    try {
      const watchId = await Geolocation.watchPosition({}, callback);
      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
    }
  }
  
  async clearWatch(watchId: string) {
    if (!isPlatform('capacitor')) {
      return;
    }
    
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  }
} 