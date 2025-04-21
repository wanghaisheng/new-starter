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
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useContactSetting } from '@/core/hooks/useSetting';

export default function ContactSettingsPage() {
  const router = useRouter();
  const { user, loading: userLoading, updateError } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { contact, loading, error, updateContact, loadContact } = useContactSetting(user?.id || '');

  useEffect(() => {
    if (user) {
      loadContact(user);
    }
  }, [user, loadContact]);

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

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateContact({}, user);
      setToastMessage('Contact settings saved successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to save contact settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updateContactSettings = (updates: Partial<User>) => {
    if (!user) return;
    updateContact(updates, user);
  };

  if (!user || !contact) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle{t('auto.page.Contact')}/IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.CONTACT')}/IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel position="stacked"{t('auto.page.EmailAd')}/IonLabel>
              <IonInput
                type="email"
                value={contact.email}
                onIonInput={e => updateContactSettings({ email: e.detail.value! })}
                placeholder={t('auto.page.Enteryo')}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel position="stacked"{t('auto.page.PhoneNu')}/IonLabel>
              <IonInput
                type="tel"
                value={contact.phone}
                onIonInput={e => updateContactSettings({ phone: e.detail.value! })}
                placeholder={t('auto.page.Enteryo')}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.VISIBILI')}/IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={globeOutline} slot="start" />
              <IonLabel{t('auto.page.ShowEma')}/IonLabel>
              <IonToggle
                checked={contact.privacySettings?.showEmailToMatches}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...contact.privacySettings,
                    showEmailToMatches: e.detail.checked
                  }
                })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel{t('auto.page.ShowPho')}/IonLabel>
              <IonToggle
                checked={contact.privacySettings?.showPhoneToMatches}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...contact.privacySettings,
                    showPhoneToMatches: e.detail.checked
                  }
                })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.SHARING')}/IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={shareSocialOutline} slot="start" />
              <IonLabel{t('auto.page.AllowPr')}/IonLabel>
              <IonToggle
                checked={contact.privacySettings?.allowProfileSharing}
                onIonChange={e => updateContactSettings({
                  privacySettings: {
                    ...contact.privacySettings,
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