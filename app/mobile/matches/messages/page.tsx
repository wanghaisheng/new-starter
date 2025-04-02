'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

// Mock data for chat conversations
const mockChats = [
  {
    id: '1',
    name: 'Sarah',
    lastMessage: 'Hey! How are you doing today?',
    time: '2h ago',
    unread: false,
    image: '/assets/images/profile-sarah.jpg',
  },
  {
    id: '2',
    name: 'Emma',
    lastMessage: "Let's meet this weekend!",
    time: '1d ago',
    unread: false,
    image: '/assets/images/profile-emma.jpg',
  },
  {
    id: '3',
    name: 'Olivia',
    lastMessage: 'Thanks for the great time yesterday 😊',
    time: '2d ago',
    unread: true,
    image: '/assets/images/profile-olivia.jpg',
  },
  {
    id: '4',
    name: 'James',
    lastMessage: 'Are you free for coffee tomorrow?',
    time: '3d ago',
    unread: false,
    image: '/assets/images/profile-james.jpg',
  },
];

export default function MessagesPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  
  const filteredChats = mockChats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase())
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
            onIonChange={e => setSearchText(e.detail.value || '')}
            placeholder="Search matches"
            className="mb-4 rounded-md"
          />
          
          <div className="space-y-4">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <Image 
                      src={chat.image}
                      alt={chat.name}
                      className="rounded-full object-cover"
                      fill
                    />
                    {chat.unread && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-base ${chat.unread ? 'font-bold' : 'font-medium'} truncate`}>
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {chat.time}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${chat.unread ? 'text-black font-medium' : 'text-gray-500'}`}>
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
} 