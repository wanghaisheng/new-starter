'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar, IonList, IonItem, IonLabel, IonAvatar } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useMessages } from '@/core/hooks/useMessages';
import { Message } from '@/core/lib/db/types/message';
import ErrorDisplay from '@/mobile/components/ErrorDisplay';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function MessagesPage() {
  useRequireAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<Message[]>([]);
  const userId = 'current-user-id'; // TODO: Replace with actual user ID from auth context

  const { messages, fetchMessages, sendMessage, updateMessage, deleteMessage, reloadMessages, loading, fetchError, sendError, updateError, deleteError, empty } = useMessages(userId);

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    setChats(messages.filter(m => m.senderId === userId || m.receiverId === userId));
  }, [messages]);

  if (fetchError || sendError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={(fetchError || sendError || updateError || deleteError)?.toString()} />
        </IonContent>
      </IonPage>
    );
  }

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
    if (loading) return <div className="p-4 text-center"{t('auto.page.')}/div>;
    if (filteredChats.length === 0) return <div className="p-4 text-center text-gray-400"{t('auto.page.')}/div>;
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
            <h1 className="text-xl font-bold"{t('auto.page.Messages')}/h1>
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
            placeholder={t('auto.page.Searchc')}
          />
          {renderChats()}
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
} 