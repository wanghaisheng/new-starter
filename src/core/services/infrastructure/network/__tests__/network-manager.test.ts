import { BrowserNetworkManager, NativeNetworkManager, NetworkStatus } from '../network-manager';

describe('BrowserNetworkManager', () => {
  it('should report online/offline', () => {
    const manager = new BrowserNetworkManager();
    manager.simulateOffline(false);
    expect(manager.isConnected()).toBe(true);
    manager.simulateOffline(true);
    expect(manager.isConnected()).toBe(false);
  });

  it('should handle status change', () => {
    const manager = new BrowserNetworkManager();
    let status: NetworkStatus = 'unknown';
    manager.onStatusChange(s => (status = s));
    manager.simulateOffline(true);
    expect(status).toBe('offline');
    manager.simulateOffline(false);
    expect(status === 'online' || status === 'limited' || status === 'slow').toBe(true);
  });
});

describe('NativeNetworkManager', () => {
  it('should handle status change event', () => {
    const manager = new NativeNetworkManager();
    let status: NetworkStatus = 'unknown';
    manager.onStatusChange(s => (status = s));
    // 模拟 native 事件
    (manager as any).handleStatusChange('proxy');
    expect(status).toBe('proxy');
    (manager as any).handleStatusChange('offline');
    expect(status).toBe('offline');
  });
});
