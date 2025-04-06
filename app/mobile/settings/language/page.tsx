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
  IonRadio,
  IonRadioGroup,
  IonButton,
  IonToast,
  IonItemDivider,
  IonItemGroup,
  IonIcon
} from '@ionic/react';
import { languageOutline } from 'ionicons/icons';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { user, loading: isLoading, error, updateUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'it', name: 'Italiano (Italian)' }
  ];

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
      
      // Load language preference from user data
      if (currentUser.preferences?.language) {
        setSelectedLanguage(currentUser.preferences.language);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('Failed to load language settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      
      // Update user preferences with the language setting
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          language: selectedLanguage
        }
      };
      
      await userService.updateUser(user.id, updatedUser);
      setToastMessage('Language settings saved successfully');
      setShowToast(true);
      
      // Apply language changes
      applyLanguageChange();
    } catch (err) {
      console.error('Error saving language settings:', err);
      setToastMessage('Failed to save language settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const applyLanguageChange = () => {
    // Store the selected language in localStorage for persistence
    localStorage.setItem('locale', selectedLanguage);
    
    // Reload the page to apply the new language
    // In a real app, you would use a more sophisticated i18n solution
    // that doesn't require a page reload
    window.location.reload();
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading language settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access language settings</p>
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
          <IonTitle>Language Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <p className="text-gray-400 mb-4">
            Select your preferred language for the app interface.
          </p>
        </div>
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>AVAILABLE LANGUAGES</IonLabel>
            </IonItemDivider>
            
            <IonRadioGroup value={selectedLanguage} onIonChange={e => setSelectedLanguage(e.detail.value)}>
              {languages.map(lang => (
                <IonItem key={lang.code}>
                  <IonIcon icon={languageOutline} slot="start" />
                  <IonLabel>{lang.name}</IonLabel>
                  <IonRadio slot="end" value={lang.code} />
                </IonItem>
              ))}
            </IonRadioGroup>
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