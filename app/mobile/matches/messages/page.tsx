'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar, IonList, IonItem, IonLabel, IonAvatar } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { MessageServiceFactory } from '@/core/services-update/business/messages/factory/message-service-factory';
import { Message } from '@/core/lib/db/types/message';

export default function MessagesPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Message[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const msgService = MessageServiceFactory.createService('advanced-hybrid');
  const userId = 'current-user-id'; // TODO: Replace with actual user ID from auth context

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoading(true);
    msgService.getUserMessages(userId)
      .then((msgs: Message[]) => { setChats(msgs); setLoading(false); })
      .catch(e => { setError('加载消息失败'); setLoading(false); });
    if (msgService.onMessageChange) {
      unsub = msgService.onMessageChange((msgs: Message[]) => {
        setChats(msgs.filter(m => m.senderId === userId || m.receiverId === userId));
      });
    }
    return () => { if (unsub) unsub(); };
  }, [userId]);

  const filteredChats = chats.filter(chat =>
    chat.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChatClick = (chatId: string) => {
    router.push(`/mobile/matches/chat?id=${chatId}`);
  };

  const handleNewMessage = () => {
    router.push(`/mobile/matches/new-message`);
  };

  const renderChats = () => {
    if (loading) return <div className="p-4 text-center">加载中...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (filteredChats.length === 0) return <div className="p-4 text-center text-gray-400">暂无会话</div>;
    return (
      <IonList>
        {filteredChats.map(chat => (
          <IonItem key={chat.id} routerLink={`/matches/chat/${chat.matchId}`}>
            <IonAvatar slot="start">
              <img src={`/assets/avatars/${chat.senderId}.jpg`} alt={chat.senderId} />
            </IonAvatar>
            <IonLabel>
              <h2>{chat.senderId}</h2>
              <p>{chat.content}</p>
            </IonLabel>
            <IonLabel slot="end">
              <p>{new Date(chat.createdAt).toLocaleTimeString()}</p>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <button 
              onClick={handleNewMessage}
              className="text-primary-500"
            >
              <IonIcon icon={pencilOutline} className="w-6 h-6" />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="p-4 pb-20">
          <IonSearchbar
            value={searchText}
            onIonInput={e => setSearchText(e.detail.value!)}
            placeholder="Search chats"
          />
          {renderChats()}
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
} 