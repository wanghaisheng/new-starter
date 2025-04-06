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
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonToast,
  IonItemDivider,
  IonItemGroup,
  IonIcon
} from '@ionic/react';
import { 
  notificationsOutline, 
  chatbubbleOutline, 
  heartOutline,
  eyeOutline,
  globeOutline,
  megaphoneOutline
} from 'ionicons/icons';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { user, loading: isLoading, error, updateUser } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newMatches: true,
    matchMessages: true,
    profileViews: true,
    profileLikes: true,
    appUpdates: true,
    promotions: false
  });

  useEffect(() => {
    // Load notification settings from user data when user is available
    if (user && user.notificationSettings) {
      setNotificationSettings(user.notificationSettings);
    }
  }, [user]);

  const loadUserData = () => {
    // This function is now just used as a retry callback for ErrorDisplay
    // The actual data loading is handled by the useUser hook
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      // Update user notification settings
      const updatedUser = {
        ...user,
        notificationSettings
      };
      
      await updateUser(updatedUser);
      setToastMessage('Notification settings saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setToastMessage('Failed to save notification settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationSetting = (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading notification settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access notification settings</p>
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
          <IonTitle>Notification Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <p className="text-gray-400 mb-4">
            Manage how and when you receive notifications.
          </p>
        </div>
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>MATCH NOTIFICATIONS</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>New Matches</IonLabel>
              <IonToggle
                checked={notificationSettings.newMatches}
                onIonChange={e => updateNotificationSetting('newMatches', e.detail.checked)}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={chatbubbleOutline} slot="start" />
              <IonLabel>Match Messages</IonLabel>
              <IonToggle
                checked={notificationSettings.matchMessages}
                onIonChange={e => updateNotificationSetting('matchMessages', e.detail.checked)}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>PROFILE NOTIFICATIONS</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={eyeOutline} slot="start" />
              <IonLabel>Profile Views</IonLabel>
              <IonToggle
                checked={notificationSettings.profileViews}
                onIonChange={e => updateNotificationSetting('profileViews', e.detail.checked)}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={heartOutline} slot="start" />
              <IonLabel>Profile Likes</IonLabel>
              <IonToggle
                checked={notificationSettings.profileLikes}
                onIonChange={e => updateNotificationSetting('profileLikes', e.detail.checked)}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>SYSTEM NOTIFICATIONS</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={globeOutline} slot="start" />
              <IonLabel>App Updates</IonLabel>
              <IonToggle
                checked={notificationSettings.appUpdates}
                onIonChange={e => updateNotificationSetting('appUpdates', e.detail.checked)}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={megaphoneOutline} slot="start" />
              <IonLabel>Promotions</IonLabel>
              <IonToggle
                checked={notificationSettings.promotions}
                onIonChange={e => updateNotificationSetting('promotions', e.detail.checked)}
              />
            </IonItem>
          </IonItemGroup>
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