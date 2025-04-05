import React, { useEffect, useState } from 'react';
import { NetworkService } from '@/core/services/network-service';
import { NetworkStatus } from '@capacitor/network';

/**
 * 网络状态指示器组件
 * 
 * 显示当前网络连接状态，在网络状态变化时更新
 */
const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasReconnected, setHasReconnected] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    // 初始化时检查网络状态
    const networkService = NetworkService.getInstance();
    setIsOnline(networkService.isOnline());

    // 监听网络状态变化
    const handleNetworkChange = (status: NetworkStatus) => {
      const online = status.connected;
      if (!isOnline && online) {
        // 从离线切换到在线
        setHasReconnected(true);
        setShowReconnected(true);
        // 3秒后隐藏重连提示
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
      setIsOnline(online);
    };

    // 添加网络状态监听器
    const listenerId = networkService.addNetworkStatusListener(handleNetworkChange);

    // 清理函数
    return () => {
      networkService.removeNetworkStatusListener(listenerId);
    };
  }, [isOnline]);

  // 如果没有显示重连通知且在线，不渲染任何内容
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2" data-testid="network-status-indicator">
      {!isOnline && (
        <div 
          className="bg-red-500 text-white py-2 px-4 rounded-md shadow-md flex items-center justify-center"
          data-testid="offline-indicator"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>您已离线，部分功能可能不可用</span>
        </div>
      )}
      
      {isOnline && showReconnected && (
        <div 
          className="bg-green-500 text-white py-2 px-4 rounded-md shadow-md flex items-center justify-center"
          data-testid="reconnected-indicator"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>网络已恢复连接</span>
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator; 