import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IonFooter, IonToolbar, IonTextarea, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { send, image, cloudUpload } from 'ionicons/icons';
import { NetworkService } from '@/core/services/network-service';
import { MessageService } from '@/core/services/message-service';
import { NetworkStatus } from '@capacitor/network';

interface MessageInputProps {
  matchId: string;
  currentUserId: string;
  receiverId: string;
  onMessageSent?: (content: string) => void;
}

/**
 * 消息输入组件
 * 
 * 处理消息的输入和发送，支持离线发送和消息状态显示
 */
const MessageInput: React.FC<MessageInputProps> = ({ 
  matchId, 
  currentUserId, 
  receiverId,
  onMessageSent 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const textareaRef = useRef<HTMLIonTextareaElement>(null);
  const networkService = NetworkService.getInstance();
  const messageService = MessageService.getInstance();
  
  // 获取离线队列中的消息数量
  const getOfflineCount = useCallback(async () => {
    try {
      const count = await messageService.getOfflineMessagesCount(matchId);
      setOfflineQueue(count);
    } catch (error) {
      console.error('Error getting offline message count:', error);
    }
  }, [matchId, messageService]);
  
  // 同步离线消息
  const syncOfflineMessages = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      const syncedCount = await messageService.syncOfflineMessages(matchId);
      if (syncedCount > 0) {
        // 更新离线队列数量
        setOfflineQueue(prev => Math.max(0, prev - syncedCount));
      }
    } catch (error) {
      console.error('Error syncing offline messages:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [matchId, messageService]);
  
  // 处理网络状态变化
  const handleNetworkChange = useCallback((status: NetworkStatus) => {
    const newStatus = networkService.getConnectionStatus();
    const newIsOffline = newStatus !== 'online';
    setIsOffline(newIsOffline);
    
    // 如果刚刚联网，并且有离线消息，尝试同步
    if (!newIsOffline && offlineQueue > 0 && !isSyncing) {
      syncOfflineMessages();
    }
  }, [networkService, offlineQueue, isSyncing, syncOfflineMessages]);
  
  // 监听网络状态变化
  useEffect(() => {
    // 初始化网络状态
    setIsOffline(networkService.getConnectionStatus() !== 'online');
    
    // 获取初始离线队列数量
    getOfflineCount();
    
    // 添加网络状态监听器
    const listenerId = networkService.addNetworkStatusListener(handleNetworkChange);
    
    // 清理监听器
    return () => {
      networkService.removeNetworkStatusListener(listenerId);
    };
  }, [networkService, handleNetworkChange, getOfflineCount]);
  
  // 发送消息
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setIsSending(true);
      
      const messageContent = message.trim();
      setMessage(''); // 立即清空输入框
      
      // 发送消息，自动处理在线/离线状态
      await messageService.sendMessage(
        matchId,
        currentUserId,
        receiverId,
        messageContent
      );
      
      // 如果是离线状态，更新离线队列计数
      if (isOffline) {
        await getOfflineCount(); // 重新获取最新的离线消息数量
      }
      
      // 调用回调通知父组件
      if (onMessageSent) {
        onMessageSent(messageContent);
      }
      
      // 调整输入框高度
      if (textareaRef.current) {
        textareaRef.current.setFocus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 恢复消息到输入框(如果发送失败)
      if (!isOffline) {
        // 在线状态下失败，可能是网络问题
        // 可以选择恢复消息到输入框
        setMessage(message);
      }
    } finally {
      setIsSending(false);
    }
  };
  
  // 处理键盘Enter键发送消息
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 支持Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // 手动同步消息
  const handleManualSync = async () => {
    if (isOffline || isSyncing || offlineQueue === 0) return;
    await syncOfflineMessages();
  };
  
  return (
    <IonFooter className="ion-no-border">
      {/* 离线消息队列提示 */}
      {offlineQueue > 0 && (
        <div 
          className={`px-4 py-1 flex items-center justify-between text-sm ${
            isOffline 
              ? 'bg-orange-100 border-t border-orange-200 text-orange-700'
              : 'bg-blue-100 border-t border-blue-200 text-blue-700'
          }`}
        >
          <span>{offlineQueue} 条消息{isOffline ? '将在网络恢复后发送' : '等待同步'}</span>
          {!isOffline && !isSyncing && (
            <IonButton 
              fill="clear" 
              size="small" 
              className="p-0 h-6 text-blue-600" 
              onClick={handleManualSync}
            >
              <IonIcon icon={cloudUpload} slot="start" />
              <span className="text-xs">立即同步</span>
            </IonButton>
          )}
          {isSyncing && (
            <div className="flex items-center">
              <IonSpinner name="dots" className="w-4 h-4 mr-1" />
              <span className="text-xs">同步中...</span>
            </div>
          )}
        </div>
      )}
      
      <IonToolbar className="px-2 py-1 bg-white">
        <div className="flex items-end">
          {/* 附加功能按钮 */}
          <IonButton 
            fill="clear" 
            className="text-gray-500 h-10" 
            disabled={isSending}
          >
            <IonIcon icon={image} slot="icon-only" />
          </IonButton>
          
          {/* 消息输入框 */}
          <div className="flex-1 mx-1">
            <IonTextarea
              ref={textareaRef}
              placeholder={isOffline ? "离线模式 - 消息将在网络恢复后发送" : "输入消息..."}
              value={message}
              rows={1}
              autoGrow={true}
              maxlength={500}
              className="border rounded-full px-4 py-2 bg-gray-50 text-gray-800"
              onIonChange={e => setMessage(e.detail.value!)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
          </div>
          
          {/* 发送按钮 */}
          <IonButton 
            fill="clear" 
            className={`${
              message.trim() ? 'text-primary-500' : 'text-gray-400'
            } h-10`}
            disabled={!message.trim() || isSending}
            onClick={sendMessage}
          >
            {isSending ? (
              <IonSpinner name="dots" />
            ) : (
              <IonIcon icon={send} slot="icon-only" />
            )}
          </IonButton>
        </div>
      </IonToolbar>
    </IonFooter>
  );
};

export default MessageInput;