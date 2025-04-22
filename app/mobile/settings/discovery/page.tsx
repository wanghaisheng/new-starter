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
import { useUser } from '@/core/hooks/useUser';
import { useDiscoverySetting } from '@/core/hooks/useSetting';
import { User, UserPreferences } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function DiscoverySettingsPage() {
  const router = useRouter();
  const { user, loading: userLoading, updateError } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { preferences, loading, error, updateDiscovery, loadDiscovery } = useDiscoverySetting(user?.id || '');

  useEffect(() => {
    if (user) {
      loadDiscovery(user);
    }
  }, [user, loadDiscovery]);

  if (userLoading || loading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (updateError || error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={updateError?.message || error?.message || ''} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user || !preferences) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDiscovery({}, user);
      setToastMessage('Settings saved successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to save settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    if (!user) return;
    updateDiscovery(updates, user);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
  {t('auto.page.Discover')}
</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          {/* Distance Settings */}
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.DISTANCE')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.Maximum')}
</IonLabel>
            <IonRange
              value={preferences.distance || 50}
              min={1}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ distance: Number(e.detail.value) })}
            />
            <IonLabel slot="end">{preferences.distance || 50} km</IonLabel>
          </IonItem>
          
          {/* Age Range Settings */}
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.AGERANG')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.Minimum')}
</IonLabel>
            <IonRange
              value={preferences.ageRange.min || 18}
              min={18}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ 
                ageRange: { 
                  ...preferences.ageRange,
                  min: Number(e.detail.value)
                }
              })}
            />
            <IonLabel slot="end">{preferences.ageRange.min || 18} years</IonLabel>
          </IonItem>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.Maximum')}
</IonLabel>
            <IonRange
              value={preferences.ageRange.max || 99}
              min={18}
              max={100}
              step={1}
              onIonChange={e => updatePreferences({ 
                ageRange: { 
                  ...preferences.ageRange,
                  max: Number(e.detail.value)
                }
              })}
            />
            <IonLabel slot="end">{preferences.ageRange.max || 99} years</IonLabel>
          </IonItem>
          
          {/* Gender Preferences */}
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.GENDERP')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowMe')}
</IonLabel>
            <IonSelect
              value={preferences.gender || ['male', 'female', 'other']}
              multiple={true}
              onIonChange={e => updatePreferences({ gender: e.detail.value })}
            >
              <IonSelectOption value="male">
  {t('auto.page.Men')}
</IonSelectOption>
              <IonSelectOption value="female">
  {t('auto.page.Women')}
</IonSelectOption>
              <IonSelectOption value="other">
  {t('auto.page.Others')}
</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          {/* Additional Settings */}
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.ADDITION')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowVer')}
</IonLabel>
            <IonToggle
              checked={preferences.dealBreakers?.includes('unverified') || false}
              onIonChange={e => {
                const dealBreakers = preferences.dealBreakers || [];
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