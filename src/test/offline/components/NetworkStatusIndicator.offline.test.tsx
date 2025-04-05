/**
 * NetworkStatusIndicator 离线功能测试
 * 
 * 测试网络状态指示器组件在网络状态变化时的行为
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import NetworkStatusIndicator from '@/mobile/components/ui/NetworkStatusIndicator';
import { NetworkService } from '@/core/services/network-service';
import { NetworkStatus } from '@capacitor/network';

// 模拟网络服务
jest.mock('@/core/services/network-service', () => {
  const listeners: Function[] = [];
  
  return {
    NetworkService: {
      getInstance: jest.fn(() => ({
        isOnline: jest.fn().mockReturnValue(true),
        addNetworkStatusListener: jest.fn((callback) => {
          listeners.push(callback);
          return 'listener-id'; // 返回监听器ID
        }),
        removeNetworkStatusListener: jest.fn(),
        simulateNetworkChange: (online: boolean) => {
          listeners.forEach(callback => callback({
            connected: online,
            connectionType: online ? 'wifi' : 'none'
          }));
        }
      }))
    }
  };
});

describe('NetworkStatusIndicator Offline Tests', () => {
  let networkService: any;
  
  beforeEach(() => {
    jest.useFakeTimers();
    networkService = NetworkService.getInstance();
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  
  it('不应在在线状态下显示任何指示器', () => {
    // 默认为在线状态
    networkService.isOnline.mockReturnValue(true);
    
    render(<NetworkStatusIndicator />);
    
    // 组件不应渲染任何内容
    const indicator = screen.queryByTestId('network-status-indicator');
    expect(indicator).not.toBeInTheDocument();
  });
  
  it('应在离线状态下显示离线指示器', () => {
    // 模拟离线状态
    networkService.isOnline.mockReturnValue(false);
    
    render(<NetworkStatusIndicator />);
    
    // 离线指示器应显示
    const offlineIndicator = screen.getByTestId('offline-indicator');
    expect(offlineIndicator).toBeInTheDocument();
    expect(offlineIndicator.textContent).toContain('您已离线');
  });
  
  it('应在网络恢复时显示重连通知并在3秒后消失', async () => {
    // 初始为离线状态
    networkService.isOnline.mockReturnValue(false);
    
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // 确认离线状态
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    
    // 模拟网络恢复连接
    act(() => {
      networkService.isOnline.mockReturnValue(true);
      // 触发网络状态监听器
      (networkService as any).simulateNetworkChange(true);
    });
    
    // 重新渲染组件以反映状态更新
    rerender(<NetworkStatusIndicator />);
    
    // 应显示重连通知
    expect(screen.getByTestId('reconnected-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('reconnected-indicator').textContent).toContain('网络已恢复连接');
    
    // 前进3秒
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // 重新渲染组件以反映状态更新
    rerender(<NetworkStatusIndicator />);
    
    // 重连通知应消失
    expect(screen.queryByTestId('reconnected-indicator')).not.toBeInTheDocument();
  });
  
  it('应在网络状态切换时更新显示', () => {
    // 初始为在线状态
    networkService.isOnline.mockReturnValue(true);
    
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // 不应显示任何指示器
    expect(screen.queryByTestId('network-status-indicator')).not.toBeInTheDocument();
    
    // 切换到离线状态
    act(() => {
      networkService.isOnline.mockReturnValue(false);
      (networkService as any).simulateNetworkChange(false);
    });
    
    // 重新渲染组件以反映状态更新
    rerender(<NetworkStatusIndicator />);
    
    // 应显示离线指示器
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    
    // 再次切换回在线状态
    act(() => {
      networkService.isOnline.mockReturnValue(true);
      (networkService as any).simulateNetworkChange(true);
    });
    
    // 重新渲染组件以反映状态更新
    rerender(<NetworkStatusIndicator />);
    
    // 应显示重连通知
    expect(screen.getByTestId('reconnected-indicator')).toBeInTheDocument();
  });
  
  it('应在组件卸载时移除事件监听器', () => {
    const { unmount } = render(<NetworkStatusIndicator />);
    
    // 卸载组件
    unmount();
    
    // 应调用removeNetworkStatusListener
    expect(networkService.removeNetworkStatusListener).toHaveBeenCalledWith('listener-id');
  });
}); 