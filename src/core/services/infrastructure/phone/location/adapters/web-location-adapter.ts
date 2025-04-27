import type { ILocationAdapter, LocationOptions, LocationResult } from '../types/location-service';

export class WebLocationAdapter implements ILocationAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return !!navigator.geolocation; }
  async getCurrentPosition(options?: LocationOptions): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        err => reject(err),
        options
      );
    });
  }
  watchPosition(options: LocationOptions, handler: (result: LocationResult) => void): string {
    if (!navigator.geolocation) return 'unsupported';
    const id = navigator.geolocation.watchPosition(
      pos => handler({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      undefined,
      options
    );
    return String(id);
  }
  clearWatch(watchId: string): void {
    if (navigator.geolocation) navigator.geolocation.clearWatch(Number(watchId));
  }
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
