'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar, IonList, IonItem, IonLabel, IonAvatar } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useServices } from '@/core/hooks/useServices';
import { Message } from '@/core/lib/db/types/message';
import { MessageService } from '@/core/services/message-service';

export default function MessagesPage() {
  const router = useRouter();
  const { messageService, isLoading, error } = useServices();
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<Message[]>([]);

  useEffect(() => {
    if (messageService) {
      loadChats();
    }
  }, [messageService]);

  const loadChats = async () => {
    if (!messageService) return;
    
    try {
      // TODO: Replace with actual user ID from auth context
      const userId = 'current-user-id';
      // Get all matches for the user and their last messages
      const matches = await messageService.getMatches(userId);
      const messages = await Promise.all(
        matches.map(match => messageService.getMessages(match.id, { limit: 1, orderBy: { createdAt: 'desc' } }))
      );
      setChats(messages.flat());
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChatClick = (chatId: string) => {
    router.push(`/mobile/matches/chat?id=${chatId}`);
  };

  const handleNewMessage = () => {
    router.push(`/mobile/matches/new-message`);
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
          
          {isLoading ? (
            <div className="p-4 text-center">Loading chats...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Error loading chats: {error.message}</div>
          ) : (
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
          )}
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
} 