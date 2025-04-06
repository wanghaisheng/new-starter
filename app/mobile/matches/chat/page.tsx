'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { Message } from '@/core/lib/db/types/message';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { useMessages } from '@/core/hooks/useMessages';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const { loading: userLoading, error: userError } = useUser();
  const { messages, loading: messageLoading, error: messageError, getMatchMessages, sendMessage } = useMessages();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userId = searchParams.get('id');
  const isLoading = userLoading || messageLoading;
  const error = userError || messageError;
  
  useEffect(() => {
    if (userId) {
      loadChat();
    }
  }, [userId, getMatchMessages]);
  
  const loadChat = async () => {
    if (!userId) return;
    
    try {
      // Load other user's profile
      const users = await userService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) {
        setToastMessage('User not found');
        setShowToast(true);
        return;
      }
      setOtherUser(user);
      
      // Load messages
      await getMatchMessages(userId);
      
      // Scroll to bottom
      scrollToBottom();
    } catch (err) {
      console.error('Error loading chat:', err);
      setToastMessage('Failed to load chat. Please try again.');
      setShowToast(true);
    }
  };
  
  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim() || !currentUser) return;
    
    try {
      await sendMessage({
        matchId: userId,
        senderId: currentUser.id,
        receiverId: userId,
        content: newMessage.trim(),
        type: 'text'
      });
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setToastMessage('Failed to send message. Please try again.');
      setShowToast(true);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === userId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === userId
                      ? 'bg-white text-gray-800'
                      : 'bg-pink-500 text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </IonContent>
      
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