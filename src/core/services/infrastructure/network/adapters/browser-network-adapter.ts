// browser-network-adapter.ts
import { NetworkManager, NetworkEventHandler } from '../network-manager';

export class BrowserNetworkAdapter implements NetworkManager {
  private connectHandlers: NetworkEventHandler[] = [];
  private disconnectHandlers: NetworkEventHandler[] = [];
  private simulatedOffline: boolean = false;
  private latencyMs: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  isConnected(): boolean {
    if (this.simulatedOffline) return false;
    if (typeof window !== 'undefined') {
      return window.navigator.onLine;
    }
    return true;
  }

  onConnect(handler: NetworkEventHandler): void {
    this.connectHandlers.push(handler);
  }
  onDisconnect(handler: NetworkEventHandler): void {
    this.disconnectHandlers.push(handler);
  }
  offConnect(handler: NetworkEventHandler): void {
    this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
  }
  offDisconnect(handler: NetworkEventHandler): void {
    this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
  }
  simulateLatency(ms: number): void {
    this.latencyMs = ms;
  }
  simulateOffline(offline: boolean): void {
    this.simulatedOffline = offline;
  }

  private handleOnline = () => {
    this.connectHandlers.forEach(h => h());
  };
  private handleOffline = () => {
    this.disconnectHandlers.forEach(h => h());
  };
}
