import React, { useState, useEffect, useCallback } from 'react';
import { IonText, IonIcon, IonSpinner } from '@ionic/react';
import { wifiOutline, cloudOfflineOutline, cloudDoneOutline } from 'ionicons/icons';
import { NetworkService, ConnectionStatus, SyncStatus, SyncDetails } from '@/core/services/network-service';
import { NetworkStatus } from '@capacitor/network';

export interface NetworkStatusIndicatorProps {
  /** 是否显示同步状态 */
  showSyncStatus?: boolean;
  /** 是否自动隐藏离线通知 */
  autoHideOfflineNotice?: boolean;
  /** 自动隐藏的超时时间（毫秒） */
  autoHideTimeout?: number;
  /** 是否显示详细的连接信息 */
  showDetailedInfo?: boolean;
}

/**
 * 网络状态显示组件
 * 
 * 显示当前网络连接状态及同步状态
 * 网络离线或恢复时显示提示，支持显示同步进度
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showSyncStatus = true,
  autoHideOfflineNotice = true,
  autoHideTimeout = 5000,
  showDetailedInfo = false
}) => {
  // 网络连接状态
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  // 同步状态
  const [syncState, setSyncState] = useState<SyncStatus>('synced');
  // 同步详情
  const [syncDetails, setSyncDetails] = useState<SyncDetails>({ pending: 0, completed: 0, failed: 0 });
  // 是否显示重连通知
  const [showReconnectedNotice, setShowReconnectedNotice] = useState(false);
  // 是否显示离线通知
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  // 服务单例
  const networkService = NetworkService.getInstance();

  // 处理同步状态变化
  const handleSyncStateChange = useCallback((status: SyncStatus, details?: SyncDetails) => {
    setSyncState(status);
    if (details) {
      setSyncDetails(details);
    }
  }, []);

  // 处理网络状态变化
  const handleNetworkChange = useCallback((status: NetworkStatus) => {
    const newStatus = networkService.getConnectionStatus();
    setConnectionStatus(newStatus);
    
    // 显示连接状态通知
    if (newStatus === 'offline') {
      // 如果变为离线，显示离线通知
      setShowOfflineNotice(true);
      setShowReconnectedNotice(false);
      
      // 如果启用了自动隐藏，设置定时器
      if (autoHideOfflineNotice) {
        setTimeout(() => {
          setShowOfflineNotice(false);
        }, autoHideTimeout);
      }
    } else if (newStatus === 'online') {
      // 如果刚连接上，显示重连通知并隐藏离线通知
      setShowReconnectedNotice(true);
      setShowOfflineNotice(false);
      
      // 3秒后自动隐藏重连通知
      setTimeout(() => {
        setShowReconnectedNotice(false);
      }, 3000);
    }
  }, [networkService, autoHideOfflineNotice, autoHideTimeout]);

  // 获取连接类型描述
  const getConnectionTypeText = useCallback((): string => {
    if (connectionStatus === 'offline') {
      return '离线';
    }
    
    const type = networkService.getConnectionType();
    switch (type) {
      case 'wifi': return 'WiFi';
      case 'cellular': return '移动数据';
      case 'ethernet': return '以太网';
      case 'unknown': return '未知连接';
      default: return type || '未知';
    }
  }, [connectionStatus, networkService]);

  // 初始化网络状态监听
  useEffect(() => {
    // 初始化状态
    setConnectionStatus(networkService.getConnectionStatus());
    
    // 添加监听器
    const networkListenerId = networkService.addNetworkStatusListener(handleNetworkChange);
    const syncListenerId = networkService.addSyncStatusListener(handleSyncStateChange);
    
    // 清理监听器
    return () => {
      networkService.removeNetworkStatusListener(networkListenerId);
      networkService.removeSyncStatusListener(syncListenerId);
    };
  }, [networkService, handleNetworkChange, handleSyncStateChange]);

  // 如果无需显示通知，直接返回null
  if (!showReconnectedNotice && !showOfflineNotice && (!showSyncStatus || syncState === 'synced')) {
    return null;
  }

  return (
    <div className="network-status-indicator">
      {/* 离线通知 */}
      {showOfflineNotice && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-50 text-orange-800 px-4 py-2 shadow-md flex items-center justify-between">
          <div className="flex items-center">
            <IonIcon icon={cloudOfflineOutline} className="mr-2" />
            <IonText>
              <span className="font-medium">您当前处于离线模式</span>
              {showDetailedInfo && (
                <span className="text-xs ml-2 opacity-75">操作将在网络恢复后同步</span>
              )}
            </IonText>
          </div>
          {showDetailedInfo && (
            <span className="text-xs">{getConnectionTypeText()}</span>
          )}
        </div>
      )}
      
      {/* 重连通知 */}
      {showReconnectedNotice && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-50 text-green-800 px-4 py-2 shadow-md flex items-center justify-between">
          <div className="flex items-center">
            <IonIcon icon={wifiOutline} className="mr-2" />
            <IonText>
              <span className="font-medium">网络已恢复</span>
              {showDetailedInfo && (
                <span className="text-xs ml-2 opacity-75">数据正在同步...</span>
              )}
            </IonText>
          </div>
          {showDetailedInfo && (
            <span className="text-xs">{getConnectionTypeText()}</span>
          )}
        </div>
      )}
      
      {/* 同步状态 */}
      {showSyncStatus && syncState !== 'synced' && (
        <div className={`fixed bottom-16 right-4 z-50 rounded-full px-3 py-1 shadow-md flex items-center text-sm ${
          syncState === 'syncing' ? 'bg-blue-50 text-blue-700' : 
          syncState === 'waiting' ? 'bg-yellow-50 text-yellow-700' : 
          'bg-red-50 text-red-700'
        }`}>
          {syncState === 'syncing' ? (
            <>
              <IonSpinner name="dots" className="w-4 h-4 mr-1" />
              <span>同步中 {syncDetails.completed}/{syncDetails.pending + syncDetails.completed + syncDetails.failed}</span>
            </>
          ) : syncState === 'waiting' ? (
            <>
              <IonIcon icon={cloudOfflineOutline} className="mr-1" />
              <span>等待同步 ({syncDetails.pending})</span>
            </>
          ) : (
            <>
              <IonIcon icon={cloudOfflineOutline} className="mr-1" />
              <span>同步失败 ({syncDetails.failed})</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator; 