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
import { useLanguageSetting } from '@/core/hooks/useSetting';
import { useTranslations } from 'next-intl';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const t = useTranslations();
  const { user, loading, updateError } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { language, loading: langLoading, error: langError, updateLanguage, loadLanguage } = useLanguageSetting(user?.id || '');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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
    if (user) {
      loadLanguage(user);
    }
  }, [user, loadLanguage]);

  useEffect(() => {
    if (language) {
      setSelectedLanguage(language);
    }
  }, [language]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateLanguage(selectedLanguage, user);
      setToastMessage('Language settings saved successfully');
      setShowToast(true);
      applyLanguageChange();
    } catch (err) {
      setToastMessage('Failed to save language settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const applyLanguageChange = () => {
    localStorage.setItem('locale', selectedLanguage);
    window.location.reload();
  };

  if (loading || langLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (updateError || langError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={updateError?.message || langError?.message || ''} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">
  {t('auto.page.Pleasel')}
</p>
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
          <IonTitle>
  {t('auto.page.Language')}
</IonTitle>
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
              <IonLabel>
  {t('auto.page.AVAILABL')}
</IonLabel>
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