'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { useServices } from '@/core/hooks/useServices';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

interface Match {
  users: string[];
  id: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const { userService, isLoading, error } = useServices();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  useEffect(() => {
    loadMatches();
  }, [userService]);
  
  const loadMatches = async () => {
    if (!userService) return;
    
    try {
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setToastMessage('Please login first');
        setShowToast(true);
        return;
      }

      const allMatches = await userService.getMatches(currentUser.id);
      setMatches(allMatches);
      
      // Get matched users
      const matchedUserIds = allMatches.flatMap(match => 
        match.users.filter(id => id !== currentUser.id)
      );
      
      const users = await userService.getUsers();
      const matchedUsersList = users.filter(user => 
        matchedUserIds.includes(user.id)
      );
      
      setMatchedUsers(matchedUsersList);
    } catch (err) {
      console.error('Error loading matches:', err);
      setToastMessage('Failed to load matches. Please try again.');
      setShowToast(true);
    }
  };
  
  const handleChat = (userId: string) => {
    router.push(`/mobile/matches/chat?id=${userId}`);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading matches..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadMatches} />
        </IonContent>
      </IonPage>
    );
  }
  
  return (
    <IonPage>
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-6">Your Matches</h1>
          
          {matchedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <p className="text-gray-400 mb-4">No matches yet</p>
              <button
                onClick={() => router.push('/mobile/discover')}
                className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
              >
                Find Matches
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {matchedUsers.map(user => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="relative h-48">
                    <Image
                      src={user.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h2 className="text-lg font-semibold">{user.name}</h2>
                    <p className="text-gray-600 text-sm mb-4">{user.bio}</p>
                    
                    <button
                      onClick={() => handleChat(user.id)}
                      className="w-full py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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