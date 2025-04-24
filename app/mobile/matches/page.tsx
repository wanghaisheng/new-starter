'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import Image from 'next/image';
import { Match, User } from '@/core/lib/db/types';
import { useMatches } from '@/core/hooks/useMatches';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function MatchesPage() {
  useRequireAuth();
  const router = useRouter();
  const { matches, matchedUsers, loading, error, getUserMatches, getMatchedUsers } = useMatches();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  useEffect(() => {
    loadMatches();
  }, []);
  
  const loadMatches = async () => {
    try {
      // The useMatches hook will automatically load matches for the current user
      // We just need to ensure we have the matched users
      if (matches.length > 0) {
        await getMatchedUsers(matches[0].users[0]);
      }
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setToastMessage(err.message || 'Failed to load matches. Please try again.');
      setShowToast(true);
      // 可在此处添加埋点 logEvent('matches_load_failed', { error: err.message })
    }
  };
  
  const handleChat = (userId: string) => {
    router.push(`/mobile/matches/chat?id=${userId}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
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
          <h1 className="text-2xl font-bold text-white mb-6">
  {t('auto.page.YourMat')}
</h1>
          
          {matchedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <p className="text-gray-400 mb-4">
  {t('auto.page.Nomatch')}
</p>
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