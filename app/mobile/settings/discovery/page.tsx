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
  IonRange,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonToast,
  IonItemDivider,
  IonList
} from '@ionic/react';
import { useServices } from '@/core/hooks/useServices';
import { User, UserPreferences } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function DiscoverySettingsPage() {
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
      setToastMessage('Failed to load settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      await userService.updateUser(user.id, user);
      setToastMessage('Settings saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setToastMessage('Failed to save settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    if (!user) return;
    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        ...updates
      }
    });
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access settings</p>
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
          <IonTitle>Discovery Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          {/* Distance Settings */}
          <IonItemDivider>
            <IonLabel>DISTANCE</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Maximum Distance</IonLabel>
            <IonRange
              value={user.preferences.distance || 50}
              min={1}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ distance: Number(e.detail.value) })}
            />
            <IonLabel slot="end">{user.preferences.distance || 50} km</IonLabel>
          </IonItem>
          
          {/* Age Range Settings */}
          <IonItemDivider>
            <IonLabel>AGE RANGE</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Minimum Age</IonLabel>
            <IonRange
              value={user.preferences.ageRange.min || 18}
              min={18}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ 
                ageRange: { 
                  ...user.preferences.ageRange,
                  min: Number(e.detail.value)
                }
              })}
            />
            <IonLabel slot="end">{user.preferences.ageRange.min || 18} years</IonLabel>
          </IonItem>
          
          <IonItem>
            <IonLabel>Maximum Age</IonLabel>
            <IonRange
              value={user.preferences.ageRange.max || 99}
              min={18}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ 
                ageRange: { 
                  ...user.preferences.ageRange,
                  max: Number(e.detail.value)
                }
              })}
            />
            <IonLabel slot="end">{user.preferences.ageRange.max || 99} years</IonLabel>
          </IonItem>
          
          {/* Gender Preferences */}
          <IonItemDivider>
            <IonLabel>GENDER PREFERENCES</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Show Me</IonLabel>
            <IonSelect
              value={user.preferences.gender || ['male', 'female', 'other']}
              multiple={true}
              onIonChange={e => updatePreferences({ gender: e.detail.value })}
            >
              <IonSelectOption value="male">Men</IonSelectOption>
              <IonSelectOption value="female">Women</IonSelectOption>
              <IonSelectOption value="other">Others</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          {/* Additional Settings */}
          <IonItemDivider>
            <IonLabel>ADDITIONAL SETTINGS</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>Show Verified Users Only</IonLabel>
            <IonToggle
              checked={user.preferences.dealBreakers?.includes('unverified') || false}
              onIonChange={e => {
                const dealBreakers = user.preferences.dealBreakers || [];
                if (e.detail.checked) {
                  updatePreferences({ 
                    dealBreakers: [...dealBreakers, 'unverified']
                  });
                } else {
                  updatePreferences({ 
                    dealBreakers: dealBreakers.filter(d => d !== 'unverified')
                  });
                }
              }}
            />
          </IonItem>
        </IonList>
        
        <div className="p-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
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