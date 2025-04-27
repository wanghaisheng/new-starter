import type { ILocationAdapter, LocationOptions, LocationResult } from '../types/location-service';

export class MockLocationAdapter implements ILocationAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return true; }
  async getCurrentPosition(options?: LocationOptions): Promise<LocationResult> {
    return { latitude: 0, longitude: 0, accuracy: 1, mock: true };
  }
  watchPosition(options: LocationOptions, handler: (result: LocationResult) => void): string {
    const id = 'mock-watch';
    setTimeout(() => handler({ latitude: 0, longitude: 0, accuracy: 1, mock: true }), 100);
    return id;
  }
  clearWatch(watchId: string): void {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
