'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IonContent, IonPage, IonToast, IonFooter } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { Message } from '@/core/lib/db/types/message';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { useMessages } from '@/core/hooks/useMessages';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import MessageInput from '@/core/components/messages/MessageInput';

export default function ChatPage() {
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const { loading: userLoading, error: userError } = useUser();
  const userId = searchParams.get('id');
  const { messages, fetchMessages, sendMessage, updateMessage, deleteMessage, reloadMessages, loading, fetchError, sendError, updateError, deleteError, empty } = useMessages(userId);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = userLoading || loading;
  const combinedError = userError || fetchError || sendError || updateError || deleteError;

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId, fetchMessages]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 发送消息（支持富媒体）
  const handleSendMessage = async (content: string, type: 'text' | 'image' = 'text', mediaUrl?: string) => {
    try {
      await sendMessage({
        matchId: userId,
        senderId: currentUser.id,
        receiverId: userId,
        content,
        type,
        mediaUrl,
      });
      scrollToBottom();
    } catch (e) {
      setToastMessage('发送失败，请重试');
      setShowToast(true);
    }
  };

  // 渲染消息列表
  const renderMessages = () => {
    if (isLoading) return <div className="p-4 text-center"{t('auto.page.')}/div>;
    if (combinedError) return <div className="p-4 text-center text-red-500">{combinedError.toString()}</div>;
    if (messages.length === 0) return <div className="p-4 text-center text-gray-400"{t('auto.page.')}/div>;
    return (
      <div className="flex flex-col gap-2">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}>{msg.content}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (fetchError || sendError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={(fetchError || sendError || updateError || deleteError)?.toString()} />
        </IonContent>
      </IonPage>
    );
  }
  
  return (
    <IonPage>
      <IonContent className="bg-[#0f172a]">
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="flex items-center p-4 bg-white shadow-md">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600"
            >
              ←
            </button>
            
            <div className="relative w-10 h-10 mr-3">
              <Image
                src={'/assets/images/profile-placeholder.jpg'}
                alt={'User'}
                fill
                className="object-cover rounded-full"
              />
            </div>
            
            <div>
              <h2 className="font-semibold"{t('auto.page.User')}/h2>
              <p className="text-sm text-gray-500"{t('auto.page.Online')}/p>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {renderMessages()}
          </div>
        </div>
      </IonContent>
      
      <IonFooter>
        <MessageInput matchId={userId} senderId={currentUser.id} receiverId={userId} onSendMessage={handleSendMessage} />
      </IonFooter>
      
      <BottomNavBar />
      
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