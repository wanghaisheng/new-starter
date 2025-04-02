'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { sendOutline, callOutline, videocamOutline, ellipsisHorizontalOutline } from 'ionicons/icons';
import Image from 'next/image';

// Mock data for contacts
const mockContacts = {
  '1': {
    id: '1',
    name: 'Sarah',
    online: true,
    image: '/assets/images/profile-sarah.jpg',
  },
  '2': {
    id: '2',
    name: 'Emma',
    online: false,
    image: '/assets/images/profile-emma.jpg',
  },
  '3': {
    id: '3',
    name: 'Olivia',
    online: true,
    image: '/assets/images/profile-olivia.jpg',
  },
  '4': {
    id: '4',
    name: 'James',
    online: false,
    image: '/assets/images/profile-james.jpg',
  },
};

// Mock messages
const mockMessagesByContact = {
  '1': [
    { id: '1', text: 'Hey there! How\'s your day going?', sender: 'them', time: '10:24 AM' },
    { id: '2', text: 'Pretty good! Just finished work. How about you?', sender: 'me', time: '10:26 AM' },
    { id: '3', text: 'Not bad! I was thinking, would you like to grab coffee this weekend?', sender: 'them', time: '10:27 AM' },
    { id: '4', text: 'That sounds great! Saturday morning?', sender: 'me', time: '10:28 AM' },
  ],
  '2': [
    { id: '1', text: 'Let\'s meet this weekend!', sender: 'them', time: '11:24 AM' },
    { id: '2', text: 'Sounds good! Where would you like to go?', sender: 'me', time: '11:30 AM' },
  ],
  '3': [
    { id: '1', text: 'Thanks for the great time yesterday 😊', sender: 'them', time: '09:24 AM' },
    { id: '2', text: 'I had a wonderful time too!', sender: 'me', time: '09:30 AM' },
    { id: '3', text: 'We should do it again sometime soon', sender: 'them', time: '09:32 AM' },
  ],
  '4': [
    { id: '1', text: 'Are you free for coffee tomorrow?', sender: 'them', time: '08:15 AM' },
    { id: '2', text: 'Yes, I should be free in the afternoon', sender: 'me', time: '08:20 AM' },
  ],
};

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const contactId = searchParams.get('id') || '1';
  const contact = mockContacts[contactId as keyof typeof mockContacts];
  const [messages, setMessages] = useState(mockMessagesByContact[contactId as keyof typeof mockMessagesByContact] || []);
  const [newMessage, setNewMessage] = useState('');

  // Scroll to bottom when messages change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: String(Date.now()),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate reply after 1-3 seconds
    setTimeout(() => {
      const replyMsg = {
        id: String(Date.now() + 1),
        text: getRandomReply(),
        sender: 'them',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages(prev => [...prev, replyMsg]);
    }, 1000 + Math.random() * 2000);
  };

  const getRandomReply = () => {
    const replies = [
      'That sounds great!',
      'Interesting! Tell me more.',
      'I\'m not sure about that.',
      'Haha, that\'s funny!',
      'I was thinking the same thing!',
      'When are you free to meet up?',
      'What are your plans for the weekend?',
      'Have you tried that new restaurant downtown?',
      'I\'d love to hear more about that.',
      'Sorry, I was busy. What were you saying?'
    ];
    
    return replies[Math.floor(Math.random() * replies.length)];
  };

  if (!contact) {
    return <div>Contact not found</div>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/matches/messages" />
          </IonButtons>
          
          <div className="flex items-center">
            <div className="relative w-8 h-8 mr-2">
              <Image 
                src={contact.image}
                alt={contact.name}
                className="rounded-full object-cover"
                fill
              />
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <IonTitle>{contact.name}</IonTitle>
          </div>
          
          <IonButtons slot="end">
            <button className="p-2">
              <IonIcon icon={callOutline} className="text-gray-600 w-5 h-5" />
            </button>
            <button className="p-2">
              <IonIcon icon={videocamOutline} className="text-gray-600 w-5 h-5" />
            </button>
            <button className="p-2">
              <IonIcon icon={ellipsisHorizontalOutline} className="text-gray-600 w-5 h-5" />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent ref={contentRef} className="ion-padding">
        <div className="space-y-4 pb-4">
          {/* Today divider */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded-full">
              Today
            </div>
          </div>
          
          {/* Messages */}
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'them' && (
                <div className="relative w-8 h-8 mr-2 flex-shrink-0 self-end">
                  <Image 
                    src={contact.image}
                    alt={contact.name}
                    className="rounded-full object-cover"
                    fill
                  />
                </div>
              )}
              
              <div className="max-w-[75%]">
                <div 
                  className={`p-3 rounded-2xl ${
                    message.sender === 'me' 
                      ? 'bg-primary-500 text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {message.text}
                </div>
                <div 
                  className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'me' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </IonContent>
      
      {/* Message input */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className={`ml-2 p-3 rounded-full ${
              newMessage.trim() ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}
            disabled={!newMessage.trim()}
          >
            <IonIcon icon={sendOutline} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </IonPage>
  );
} 