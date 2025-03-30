import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, checkmarkDoneOutline, timeOutline } from 'ionicons/icons';

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  className?: string;
  showText?: boolean;
}

/**
 * 消息状态组件
 * 用于显示消息的发送、送达和已读状态
 */
const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  isRead, 
  className = '', 
  showText = false 
}) => {
  // 确定实际状态（兼容isRead字段）
  const actualStatus = isRead ? 'read' : status;
  
  return (
    <div className={`flex items-center ${className}`}>
      {actualStatus === 'read' ? (
        <>
          <IonIcon icon={checkmarkDoneOutline} className="text-blue-500" />
          {showText && <span className="ml-1 text-xs">已读</span>}
        </>
      ) : actualStatus === 'delivered' ? (
        <>
          <IonIcon icon={checkmarkOutline} />
          {showText && <span className="ml-1 text-xs">已送达</span>}
        </>
      ) : (
        <>
          <IonIcon icon={timeOutline} />
          {showText && <span className="ml-1 text-xs">已发送</span>}
        </>
      )}
    </div>
  );
};

export default MessageStatus;