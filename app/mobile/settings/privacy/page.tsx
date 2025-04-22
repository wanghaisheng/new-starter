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
  IonList,
  IonSpinner
} from '@ionic/react';
import { usePrivacySetting } from '@/core/hooks/useSetting';
import { useToast } from '@/core/hooks/useToast';
import { useUser } from '@/core/hooks/useUser';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { PrivacySettings } from '@/core/types/settings';

export default function PrivacySettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const { user, loading: userLoading, updateError } = useUser();
  const { triggerToast, showToast, toastMessage, setShowToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { privacy, loading, error, updatePrivacy, loadPrivacy } = usePrivacySetting(user?.id || '');

  useEffect(() => {
    if (user) {
      loadPrivacy(user);
    }
  }, [user, loadPrivacy]);

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

  if (!user || !privacy) {
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
      await updatePrivacy({}, user);
      triggerToast('隐私设置已保存');
    } catch (err) {
      triggerToast('保存隐私设置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrivacyForm = (updates: Partial<PrivacySettings>) => {
    if (!user) return;
    updatePrivacy(updates, user);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
  {t('auto.page.Privacy')}
</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.PROFILE')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowPro')}
</IonLabel>
            <IonToggle
              checked={privacy.showProfileToEveryone}
              onIonChange={e => updatePrivacyForm({ showProfileToEveryone: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowOnl')}
</IonLabel>
            <IonToggle
              checked={privacy.showOnlineStatus}
              onIonChange={e => updatePrivacyForm({ showOnlineStatus: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowLas')}
</IonLabel>
            <IonToggle
              checked={privacy.showLastActive}
              onIonChange={e => updatePrivacyForm({ showLastActive: e.detail.checked })}
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.MATCHING')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowMe')}
</IonLabel>
            <IonToggle
              checked={privacy.showInDiscovery}
              onIonChange={e => updatePrivacyForm({ showInDiscovery: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.ShowDis')}
</IonLabel>
            <IonToggle
              checked={privacy.showDistance}
              onIonChange={e => updatePrivacyForm({ showDistance: e.detail.checked })}
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>
  {t('auto.page.DATAP')}
</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.AllowDa')}
</IonLabel>
            <IonToggle
              checked={privacy.allowDataCollection}
              onIonChange={e => updatePrivacyForm({ allowDataCollection: e.detail.checked })}
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>
  {t('auto.page.AllowPe')}
</IonLabel>
            <IonToggle
              checked={privacy.allowPersonalizedAds}
              onIonChange={e => updatePrivacyForm({ allowPersonalizedAds: e.detail.checked })}
            />
          </IonItem>
        </IonList>
        
        <div className="p-4">
          <IonButton loading={isSaving} onClick={handleSave}>
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