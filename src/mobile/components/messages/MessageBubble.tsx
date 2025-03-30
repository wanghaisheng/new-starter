import React from 'react';
import { Message } from '@/core/models/message';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { checkmarkOutline, checkmarkDoneOutline, timeOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

/**
 * 消息气泡组件
 * 用于在聊天详情页面中显示单条消息
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  // 格式化消息时间
  const formatMessageTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: false, locale: zhCN });
    } catch (error) {
      return '未知时间';
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${isCurrentUser 
          ? 'bg-pink-600 text-white rounded-tr-none' 
          : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}
      >
        <p className="text-sm">{message.content}</p>
        <p className="text-xs mt-1 opacity-70 text-right">
          {formatMessageTime(message.createdAt)}
          {isCurrentUser && (
            <span className="ml-2 flex items-center">
              {message.status === 'read' || message.isRead ? (
                <>
                  <IonIcon icon={checkmarkDoneOutline} className="mr-1 text-xs" />
                  已读
                </>
              ) : message.status === 'delivered' ? (
                <>
                  <IonIcon icon={checkmarkOutline} className="mr-1 text-xs" />
                  已送达
                </>
              ) : (
                <>
                  <IonIcon icon={timeOutline} className="mr-1 text-xs" />
                  已发送
                </>
              )}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;