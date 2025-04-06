'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonToast,
  IonItemDivider,
  IonList
} from '@ionic/react';
import { useServices } from '@/core/hooks/useServices';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { userService, isLoading, error } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userService]);

  const loadUserData = async () => {
    if (!userService) return;

    try {
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setToastMessage('Please login first');
        setShowToast(true);
        return;
      }
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('Failed to load privacy settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      await userService.updateUser(user.id, user);
      setToastMessage('Privacy settings saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setToastMessage('Failed to save privacy settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrivacySettings = (updates: Partial<User['privacySettings']>) => {
    if (!user) return;
    setUser({
      ...user,
      privacySettings: {
        ...user.privacySettings,
        ...updates
      }
    });
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading privacy settings..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadUserData} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">Please login to access privacy settings</p>
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Privacy Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          <IonItemDivider>
            <IonLabel>PROFILE VISIBILITY</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Show Profile to Everyone</IonLabel>
            <IonToggle
              checked={user.privacySettings?.showProfileToEveryone}
              onIonChange={e => updatePrivacySettings({ showProfileToEveryone: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>Show Online Status</IonLabel>
            <IonToggle
              checked={user.privacySettings?.showOnlineStatus}
              onIonChange={e => updatePrivacySettings({ showOnlineStatus: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>Show Last Active</IonLabel>
            <IonToggle
              checked={user.privacySettings?.showLastActive}
              onIonChange={e => updatePrivacySettings({ showLastActive: e.detail.checked })}
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>MATCHING</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Show Me in Discovery</IonLabel>
            <IonToggle
              checked={user.privacySettings?.showInDiscovery}
              onIonChange={e => updatePrivacySettings({ showInDiscovery: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>Show Distance</IonLabel>
            <IonToggle
              checked={user.privacySettings?.showDistance}
              onIonChange={e => updatePrivacySettings({ showDistance: e.detail.checked })}
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>DATA & PRIVACY</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Allow Data Collection</IonLabel>
            <IonToggle
              checked={user.privacySettings?.allowDataCollection}
              onIonChange={e => updatePrivacySettings({ allowDataCollection: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>Allow Personalized Ads</IonLabel>
            <IonToggle
              checked={user.privacySettings?.allowPersonalizedAds}
              onIonChange={e => updatePrivacySettings({ allowPersonalizedAds: e.detail.checked })}
            />
          </IonItem>
        </IonList>
        
        <div className="p-4">
          <IonButton
            expand="block"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </IonButton>
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