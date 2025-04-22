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
import { useNotificationSetting } from '@/core/hooks/useSetting';
import { useToast } from '@/core/hooks/useToast';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import { FormSaveButton } from '@/core/components/form/FormSaveButton';
import { NotificationSettings } from '@/core/types/settings';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { user, loading: userLoading, updateError } = useUser();
  const { triggerToast, showToast, toastMessage, setShowToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { notification, loading, error, updateNotification, loadNotification } = useNotificationSetting(user?.id || '');

  useEffect(() => {
    if (user) {
      loadNotification(user);
    }
  }, [user, loadNotification]);

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

  if (!user || !notification) {
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
      await updateNotification({}, user);
      triggerToast('Notification settings saved successfully');
    } catch (err) {
      triggerToast('Failed to save notification settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationForm = (updates: Partial<NotificationSettings>) => {
    if (!user) return;
    updateNotification(updates, user);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
  {t('auto.page.Notifica')}
</IonTitle>
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
              <IonLabel>
  {t('auto.page.MATCHNO')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>
  {t('auto.page.NewMatc')}
</IonLabel>
              <IonToggle
                checked={notification.newMatches}
                onIonChange={e => updateNotificationForm({ newMatches: e.detail.checked })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={chatbubbleOutline} slot="start" />
              <IonLabel>
  {t('auto.page.MatchMe')}
</IonLabel>
              <IonToggle
                checked={notification.matchMessages}
                onIonChange={e => updateNotificationForm({ matchMessages: e.detail.checked })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.PROFILE')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={eyeOutline} slot="start" />
              <IonLabel>
  {t('auto.page.Profile')}
</IonLabel>
              <IonToggle
                checked={notification.profileViews}
                onIonChange={e => updateNotificationForm({ profileViews: e.detail.checked })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={heartOutline} slot="start" />
              <IonLabel>
  {t('auto.page.Profile')}
</IonLabel>
              <IonToggle
                checked={notification.profileLikes}
                onIonChange={e => updateNotificationForm({ profileLikes: e.detail.checked })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.SYSTEMN')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={globeOutline} slot="start" />
              <IonLabel>
  {t('auto.page.AppUpda')}
</IonLabel>
              <IonToggle
                checked={notification.appUpdates}
                onIonChange={e => updateNotificationForm({ appUpdates: e.detail.checked })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={megaphoneOutline} slot="start" />
              <IonLabel>
  {t('auto.page.Promotio')}
</IonLabel>
              <IonToggle
                checked={notification.promotions}
                onIonChange={e => updateNotificationForm({ promotions: e.detail.checked })}
              />
            </IonItem>
          </IonItemGroup>
        </IonList>
        
        <div className="p-4">
          <FormSaveButton loading={isSaving} onClick={handleSave}>
            Save Changes
          </FormSaveButton>
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