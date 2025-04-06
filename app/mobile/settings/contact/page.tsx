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
  IonInput,
  IonToggle,
  IonButton,
  IonToast,
  IonItemDivider,
  IonItemGroup,
  IonIcon
} from '@ionic/react';
import { 
  mailOutline, 
  callOutline, 
  globeOutline,
  shareSocialOutline
} from 'ionicons/icons';
import { useServices } from '@/core/hooks/useServices';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ContactSettingsPage() {
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
      setToastMessage('Failed to load contact settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      await userService.updateUser(user.id, user);
      setToastMessage('Contact settings saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving contact settings:', err);
      setToastMessage('Failed to save contact settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updateContactSettings = (updates: Partial<User>) => {
    if (!user) return;
    setUser({
      ...user,
      ...updates
    });
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading contact settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access contact settings</p>
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
          <IonTitle>Contact Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>CONTACT INFORMATION</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel position="stacked">Email Address</IonLabel>
              <IonInput
                type="email"
                value={user.email}
                onIonInput={e => updateContactSettings({ email: e.detail.value! })}
                placeholder="Enter your email"
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel position="stacked">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={user.phone}
                onIonInput={e => updateContactSettings({ phone: e.detail.value! })}
                placeholder="Enter your phone number"
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>VISIBILITY</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={globeOutline} slot="start" />
              <IonLabel>Show Email to Matches</IonLabel>
              <IonToggle
                checked={user.privacySettings?.showEmailToMatches}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...user.privacySettings,
                    showEmailToMatches: e.detail.checked
                  }
                })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel>Show Phone to Matches</IonLabel>
              <IonToggle
                checked={user.privacySettings?.showPhoneToMatches}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...user.privacySettings,
                    showPhoneToMatches: e.detail.checked
                  }
                })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>SHARING</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={shareSocialOutline} slot="start" />
              <IonLabel>Allow Profile Sharing</IonLabel>
              <IonToggle
                checked={user.privacySettings?.allowProfileSharing}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...user.privacySettings,
                    allowProfileSharing: e.detail.checked
                  }
                })}
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