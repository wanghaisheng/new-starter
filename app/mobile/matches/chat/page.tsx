'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IonContent, IonPage, IonToast, IonFooter } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { Message } from '@/core/lib/db/types/message';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { MessageServiceFactory } from '@/core/services-update/business/messages/factory/message-service-factory';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import MessageInput from '@/mobile/components/MessageInput';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const { loading: userLoading, error: userError } = useUser();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [otherUserError, setOtherUserError] = useState<Error | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userId = searchParams.get('id');
  const isLoading = userLoading || isLoadingUser;
  const error = userError || otherUserError;
  
  const msgService = MessageServiceFactory.createService('advanced-hybrid');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadChat();
    }
  }, [userId]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoading(true);
    msgService.getMessagesByPage(userId, 0, 50)
      .then((msgs: Message[]) => {
        setMessages(msgs);
        setLoading(false);
        scrollToBottom();
      })
      .catch(e => { setOtherUserError('加载消息失败'); setLoading(false); });
    // 监听消息变更
    if (msgService.onMessageChange) {
      unsub = msgService.onMessageChange((msgs: Message[]) => {
        setMessages(msgs.filter(m => m.matchId === userId));
        scrollToBottom();
      });
    }
    return () => { if (unsub) unsub(); };
  }, [userId]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 发送消息（支持富媒体）
  const handleSendMessage = async (content: string, type: 'text' | 'image' = 'text', mediaUrl?: string) => {
    try {
      await msgService.sendRichMessage({
        matchId: userId,
        senderId: currentUser.id,
        receiverId: userId,
        content,
        type,
        mediaUrl
      });
    } catch (e) {
      setToastMessage('发送失败');
      setShowToast(true);
    }
  };

  // 渲染消息列表
  const renderMessages = () => {
    if (isLoading) return <div className="p-4 text-center">加载中...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error.toString()}</div>;
    if (messages.length === 0) return <div className="p-4 text-center text-gray-400">暂无消息</div>;
    return (
      <div className="flex flex-col gap-2">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}>{msg.content}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const loadChat = async () => {
    if (!userId) return;
    
    try {
      // Load other user's profile using API
      setIsLoadingUser(true);
      setOtherUserError(null);
      
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      
      const user = await response.json();
      setOtherUser(user);
    } catch (err) {
      console.error('Error loading chat:', err);
      setOtherUserError(err instanceof Error ? err : new Error('Failed to load user'));
      setToastMessage('Failed to load chat. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoadingUser(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading chat..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadChat} />
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
                src={otherUser?.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                alt={otherUser?.name || 'User'}
                fill
                className="object-cover rounded-full"
              />
            </div>
            
            <div>
              <h2 className="font-semibold">{otherUser?.name}</h2>
              <p className="text-sm text-gray-500">Online</p>
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