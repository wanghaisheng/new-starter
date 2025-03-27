'use client';

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonList, IonItem, IonAvatar, IonLabel, IonBadge } from '@ionic/react';
import { useRouter } from 'next/navigation';
import { Match, User } from '@/core/models/user';
import { mockMatches } from '@/core/lib/db/mock/matches';
import { mockUsers } from '@/core/lib/db/mock/users';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  
  useEffect(() => {
    // 在实际应用中，这里会从API获取匹配数据
    setMatches(mockMatches);
    
    // 创建用户ID到用户对象的映射
    const usersMap: Record<string, User> = {};
    mockUsers.forEach(user => {
      usersMap[user.id] = user;
    });
    setUsers(usersMap);
  }, []);
  
  // 获取当前用户ID（在实际应用中会从认证服务获取）
  const currentUserId = '1';
  
  // 获取匹配用户的信息
  const getMatchedUser = (match: Match) => {
    const otherUserId = match.users[0] === currentUserId ? match.users[1] : match.users[0];
    return users[otherUserId];
  };
  
  // 格式化最后消息时间
  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // 不到一分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 不到一小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    
    // 不到一天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    
    // 不到一周
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }
    
    // 其他情况显示日期
    return timestamp.toLocaleDateString();
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>我的匹配</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {matches.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <h2 className="text-xl font-semibold mb-2">暂无匹配</h2>
              <p className="text-gray-500">继续滑动寻找心动的Ta吧！</p>
            </div>
          </div>
        ) : (
          <IonList>
            {matches.map(match => {
              const matchedUser = getMatchedUser(match);
              if (!matchedUser) return null;
              
              return (
                <IonItem 
                  key={match.id} 
                  button 
                  detail
                  onClick={() => router.push(`/matches/${match.id}`)}
                >
                  <IonAvatar slot="start">
                    <img src={matchedUser.images[0]} alt={matchedUser.name} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{matchedUser.name}</h2>
                    {match.lastMessage && (
                      <p className="text-gray-500 truncate">
                        {match.lastMessage.senderId === currentUserId ? '你: ' : ''}
                        {match.lastMessage.text}
                      </p>
                    )}
                  </IonLabel>
                  {match.lastMessage && (
                    <div className="text-xs text-gray-400">
                      {formatLastMessageTime(match.lastMessage.timestamp)}
                    </div>
                  )}
                  {/* 可以添加未读消息标记 */}
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
} 