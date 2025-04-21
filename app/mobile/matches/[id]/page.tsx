'use client';

import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton, 
  IonLoading,
  IonToast,
  IonContent,
  IonFooter
} from '@ionic/react';
import { useParams } from 'next/navigation';
import { User } from '@/core/lib/db/types/user';
import { Match } from '@/core/lib/db/types/match';
import { useUser } from '@/core/hooks/useUser';
import { useMatches } from '@/core/hooks/useMatches';
import { useMessages } from '@/core/hooks/useMessages';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import RealTimeChat from '@/core/components/messages/RealTimeChat';
import MessageInput from '@/core/components/messages/MessageInput';

// 修复与规范：
// 1. 统一 service/hook 获取用户、配对、消息数据
// 2. 所有异常、加载、无数据状态均有兜底提示
// 3. 变量命名、注释、toast 反馈优化

export default function ChatPage() {
  useRequireAuth();
  const params = useParams();
  const matchId = params.id as string;
  // 用户信息
  const { user, loading: userLoading, error: userError } = useUser();
  // 匹配列表与操作
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  // 消息 hooks
  const { 
    messages, 
    fetchMessages, 
    sendMessage, 
    updateMessage, 
    deleteMessage, 
    reloadMessages, 
    loading, 
    fetchError, 
    sendError, 
    updateError, 
    deleteError, 
    empty 
  } = useMessages(matchId);
  const [match, setMatch] = useState<Match | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!userLoading && !matchesLoading) {
      loadChatData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, matchesLoading, user, matches, matchId]);

  const loadChatData = async () => {
    try {
      if (!user) {
        setToastMessage('请先登录');
        setShowToast(true);
        return;
      }
      // 查找当前 match
      const currentMatch = matches.find(m => m.id === matchId);
      if (!currentMatch) {
        setToastMessage('找不到匹配信息');
        setShowToast(true);
        return;
      }
      setMatch(currentMatch);
      // 获取匹配用户信息
      const otherUserId = currentMatch.users.find(id => id !== user.id);
      if (!otherUserId) {
        setToastMessage('找不到用户信息');
        setShowToast(true);
        return;
      }
      const matched = currentMatch.userDetails?.find(u => u.id === otherUserId) || null;
      setMatchedUser(matched);
      // 加载消息
      await fetchMessages();
    } catch (err: any) {
      setToastMessage('加载聊天数据时出错');
      setShowToast(true);
    }
  };

  const handleSendMessage = async (content: string): Promise<void> => {
    try {
      if (!user || !matchedUser) throw new Error('用户信息缺失');
      await sendMessage({
        matchId,
        senderId: user.id,
        receiverId: matchedUser.id,
        content,
      });
    } catch (err: any) {
      setToastMessage(err.message || '发送消息失败');
      setShowToast(true);
    }
  };

  if (userLoading || matchesLoading || loading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <IonLoading isOpen={true} message={t('auto.page.')} />
        </IonContent>
      </IonPage>
    );
  }
  if (userError || matchesError || fetchError || sendError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">{(userError?.message || matchesError?.message || fetchError?.toString() || sendError?.toString() || updateError?.toString() || deleteError?.toString())}</p>
            <button
              onClick={loadChatData}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              重试
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  if (!match || !matchedUser) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4"{t('auto.page.')}/p>
            <button
              onClick={loadChatData}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/matches/messages" />
          </IonButtons>
          <IonTitle>{matchedUser.name || '聊天'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-[#0f172a]">
        {/* 实时聊天组件 */}
        <RealTimeChat
          chats={[
            {
              id: matchId,
              name: matchedUser.name,
              avatar: matchedUser.avatar || '',
              messages: messages
            }
          ]}
          activeChatId={matchId}
          onSelectChat={() => {}}
          onSend={(chatId, msg) => handleSendMessage(msg)}
        />
      </IonContent>
      <IonFooter>
        {/* 消息输入框 */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={loading}
        />
      </IonFooter>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
}