import React, { useState, useEffect } from 'react';
import { IonList, IonItem, IonLabel, IonSkeletonText } from '@ionic/react';
import { useRouter } from 'next/navigation';
import { Match, User, Message } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { MessageService } from '@/core/services/message-service';
import MessageItem from './MessageItem';

interface ChatListProps {
  currentUserId: string;
  onError?: (error: string) => void;
}

/**
 * 聊天列表组件
 * 显示用户的所有匹配聊天会话
 */
const ChatList: React.FC<ChatListProps> = ({ currentUserId, onError }) => {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const userService = UserService.getInstance();
  const messageService = MessageService.getInstance();

  useEffect(() => {
    loadChatList();
    
    // 组件卸载时清理
    return () => {
      // 清理消息监听器
      messageService.cleanup();
    };
  }, [currentUserId]);

  /**
   * 加载聊天列表数据
   */
  const loadChatList = async () => {
    try {
      setIsLoading(true);
      
      // 获取用户的所有匹配
      const userMatches = await userService.getMatches(currentUserId);
      setMatches(userMatches);
      
      // 获取所有匹配用户的信息
      const usersMap: Record<string, User> = {};
      for (const match of userMatches) {
        const otherUserId = match.users[0] === currentUserId ? match.users[1] : match.users[0];
        const user = await userService.getUserById(otherUserId);
        if (user) {
          usersMap[otherUserId] = user;
        }
      }
      setUsers(usersMap);
      
      // 获取每个匹配的最后一条消息
      const messagesMap: Record<string, Message> = {};
      for (const match of userMatches) {
        const messages = await messageService.getMessages(match.id);
        if (messages.length > 0) {
          // 按时间排序，获取最新消息
          const sortedMessages = messages.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          messagesMap[match.id] = sortedMessages[0];
          
          // 为每个匹配添加消息监听器，以便实时更新
          messageService.addMessageListener(match.id, (updatedMessages) => {
            if (updatedMessages.length > 0) {
              const latestMessage = updatedMessages.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              
              setLastMessages(prev => ({
                ...prev,
                [match.id]: latestMessage
              }));
            }
          });
        }
      }
      setLastMessages(messagesMap);
    } catch (error) {
      console.error('Error loading chat list:', error);
      if (onError) {
        onError('加载聊天列表失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取匹配用户的信息
   */
  const getMatchedUser = (match: Match): User | null => {
    const otherUserId = match.users[0] === currentUserId ? match.users[1] : match.users[0];
    return users[otherUserId] || null;
  };

  /**
   * 处理点击聊天项
   */
  const handleChatItemClick = (matchId: string) => {
    // 导航到聊天详情页面
    router.push(`/matches/${matchId}`);
    
    // 标记该匹配的所有消息为已读
    messageService.markAllMessagesAsRead(matchId, currentUserId);
  };

  // 加载状态
  if (isLoading) {
    return (
      <IonList>
        {[1, 2, 3].map((item) => (
          <IonItem key={item}>
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
              <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
            </div>
            <IonLabel>
              <h3>
                <IonSkeletonText animated style={{ width: '50%' }} />
              </h3>
              <p>
                <IonSkeletonText animated style={{ width: '80%' }} />
              </p>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    );
  }

  // 没有匹配
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-4">还没有匹配的用户</p>
        <button
          onClick={() => router.push('/home')}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg"
        >
          去寻找匹配
        </button>
      </div>
    );
  }

  // 按最后消息时间排序匹配
  const sortedMatches = [...matches].sort((a, b) => {
    const aTime = lastMessages[a.id] ? new Date(lastMessages[a.id].createdAt).getTime() : new Date(a.createdAt).getTime();
    const bTime = lastMessages[b.id] ? new Date(lastMessages[b.id].createdAt).getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <IonList>
      {sortedMatches.map((match) => {
        const matchedUser = getMatchedUser(match);
        if (!matchedUser) return null;

        return (
          <MessageItem
            key={match.id}
            matchId={match.id}
            user={matchedUser}
            lastMessage={lastMessages[match.id]}
            currentUserId={currentUserId}
            onClick={() => handleChatItemClick(match.id)}
          />
        );
      })}
    </IonList>
  );
};

export default ChatList;