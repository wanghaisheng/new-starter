import React from 'react';
import { IonItem, IonAvatar, IonLabel, IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, checkmarkOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { User } from '@/core/lib/db/types/user';
import { Message } from '@/core/lib/db/types/message';

interface MessageItemProps {
  matchId: string;
  user: User;
  lastMessage?: Message;
  currentUserId: string;
  onClick: () => void;
}

/**
 * 消息列表项组件
 * 用于在聊天列表中显示匹配用户和最后一条消息
 */
const MessageItem: React.FC<MessageItemProps> = ({
  matchId,
  user,
  lastMessage,
  currentUserId,
  onClick
}) => {
  // 判断是否有未读消息
  const hasUnread = lastMessage && 
    lastMessage.senderId !== currentUserId && 
    lastMessage.status !== 'read';
  
  // 格式化最后消息时间
  const formatLastMessageTime = (timestamp: Date | string): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (error) {
      return '未知时间';
    }
  };

  return (
    <IonItem 
      onClick={onClick}
      detail={true}
      className="my-2 rounded-lg shadow-sm"
    >
      <IonAvatar slot="start" className="w-14 h-14">
        <img 
          src={user.photos?.[0]?.url || '/assets/images/default-avatar.png'} 
          alt={user.name} 
          className="object-cover w-full h-full"
        />
      </IonAvatar>
      
      <IonLabel>
        <h2 className="font-semibold text-lg">{user.name}</h2>
        <p className="text-sm text-gray-500 truncate">
          {lastMessage ? lastMessage.content : '开始聊天吧'}
        </p>
      </IonLabel>
      
      {lastMessage && (
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 flex items-center">
            <IonIcon icon={timeOutline} className="mr-1" />
            {formatLastMessageTime(lastMessage.createdAt)}
          </div>
          
          {hasUnread && (
            <IonBadge color="danger" className="mt-1">
              新
            </IonBadge>
          )}
        </div>
      )}
    </IonItem>
  );
};

export default MessageItem;