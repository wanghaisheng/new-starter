'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonToast
} from '@ionic/react';
import { settingsOutline, pencilOutline } from 'ionicons/icons';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useApi } from '@/core/hooks/useApi';
import { apiClient } from '@/utils/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { 
    data: user,
    loading: isLoading,
    error,
    execute: fetchProfile,
    networkStatus
  } = useApi<User>(
    () => apiClient.getCurrentUser(),
    {
      immediate: true,
      offlineFirst: true,
      requireAuth: true
    }
  );

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  const handleSettings = () => {
    router.push('/mobile/settings');
  };

  const handleRetry = () => {
    fetchProfile(() => apiClient.getCurrentUser());
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading profile..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={handleRetry} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">No profile found</p>
            <button
              onClick={() => router.push('/mobile/auth/login')}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Calculate age from birthDate
  const age = user.birthDate ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / 31557600000) : null;
  
  // Format location
  const locationText = user.location ? `${user.location.city}, ${user.location.country}` : 'Not specified';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSettings}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
            <IonButton onClick={handleEditProfile}>
              <IonIcon icon={pencilOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="max-w-md mx-auto p-4">
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-lg overflow-hidden">
              {user.photos && user.photos.length > 0 ? (
                <img 
                  src={user.photos[0].url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600" />
              )}
            </div>
            
            <div className="absolute -bottom-12 left-4">
              <div className="w-24 h-24 border-4 border-white rounded-full overflow-hidden">
                {user.photos && user.photos.length > 0 ? (
                  <img 
                    src={user.photos[0].url} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    <span className="text-2xl text-gray-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-16 space-y-4 text-white">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-300">{user.bio || 'No bio yet'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-sm font-medium text-gray-400">Age</h2>
                <p>{age || 'Not specified'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400">Location</h2>
                <p>{locationText}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400">Gender</h2>
                <p>{user.gender || 'Not specified'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400">Looking for</h2>
                <p>{user.preferences?.gender?.join(', ') || 'Not specified'}</p>
              </div>
            </div>
            
            {user.interests && user.interests.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-2">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {networkStatus === 'offline' && (
          <div className="fixed bottom-16 left-0 right-0 bg-yellow-500 text-black py-2 px-4 text-center">
            You're offline. Some features may be limited.
          </div>
        )}
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