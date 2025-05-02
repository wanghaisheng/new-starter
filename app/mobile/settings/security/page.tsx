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
  IonToast,
  IonItemDivider,
  IonItemGroup,
  IonIcon,
  IonBadge,
  IonNote,
  IonAlert
} from '@ionic/react';
import { 
  shieldOutline, 
  lockClosedOutline, 
  keyOutline, 
  phonePortraitOutline, 
  mailOutline, 
  timeOutline, 
  warningOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useToast } from '@/core/hooks/useToast';
import { useSecuritySetting } from '@/core/hooks/useSetting';
import { SecuritySettings } from '@/core/types/settings';
import { FormSaveButton } from '@/core/components/form/FormSaveButton';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { useTranslations } from 'next-intl';

export default function SecuritySettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const t = useTranslations();
  const { user, loading: userLoading, updateError } = useUser();
  const { triggerToast, showToast, toastMessage, setShowToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { security, loading, error, updateSecurity, loadSecurity } = useSecuritySetting(user?.id || '');

  useEffect(() => {
    if (user) {
      loadSecurity(user);
    }
  }, [user, loadSecurity]);

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

  if (!user || !security) {
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
      await updateSecurity({}, user);
      triggerToast('安全设置已保存');
    } catch (err) {
      triggerToast('保存安全设置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSecurityForm = (updates: Partial<SecuritySettings>) => {
    if (!user) return;
    updateSecurity(updates, user);
  };

  // Mock login history data
  const [loginHistory, setLoginHistory] = useState([
    { id: 1, device: 'iPhone 13', location: 'New York, USA', date: '2023-04-05 14:30', current: true },
    { id: 2, device: 'MacBook Pro', location: 'New York, USA', date: '2023-04-03 09:15', current: false },
    { id: 3, device: 'Samsung Galaxy S21', location: 'Boston, USA', date: '2023-03-28 18:45', current: false },
    { id: 4, device: 'iPad Pro', location: 'Chicago, USA', date: '2023-03-15 11:20', current: false }
  ]);

  const handleChangePassword = () => {
    router.push('/mobile/settings/account');
  };

  const handleEnableTwoFactor = () => {
    updateSecurityForm({ twoFactorEnabled: true });
    triggerToast('Two-factor authentication enabled');
  };

  const handleLogoutAllDevices = async () => {
    try {
      // In a real app, this would call an API to invalidate all sessions
      triggerToast('Logged out from all devices');
      
      // Refresh login history to show only current device
      setLoginHistory(loginHistory.map(item => ({ ...item, current: item.id === 1 })));
    } catch (err) {
      console.error('Error logging out from all devices:', err);
      triggerToast('Failed to logout from all devices. Please try again.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
  {t('auto.page.Security')}
</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <p className="text-gray-400 mb-4">
            Manage your account security and privacy settings.
          </p>
        </div>
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.ACCOUNT')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={handleChangePassword}>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel>
  {t('auto.page.ChangeP')}
</IonLabel>
              <IonNote slot="end" color="medium">
  {t('auto.page.Lastcha')}
</IonNote>
            </IonItem>
            
            <IonItem button onClick={handleEnableTwoFactor}>
              <IonIcon icon={phonePortraitOutline} slot="start" />
              <IonLabel>
  {t('auto.page.TwoFact')}
</IonLabel>
              <IonToggle 
                slot="end" 
                checked={security.twoFactorEnabled} 
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.SECURITY')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel>
  {t('auto.page.EmailNo')}
</IonLabel>
              <IonToggle 
                slot="end" 
                checked={security.emailNotifications} 
                onIonChange={(e) => updateSecurityForm({ emailNotifications: e.detail.checked })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={warningOutline} slot="start" />
              <IonLabel>
  {t('auto.page.LoginAl')}
</IonLabel>
              <IonToggle 
                slot="end" 
                checked={security.loginAlerts} 
                onIonChange={(e) => updateSecurityForm({ loginAlerts: e.detail.checked })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.LOGINHI')}
</IonLabel>
            </IonItemDivider>
            
            {loginHistory.map(item => (
              <IonItem key={item.id}>
                <IonIcon icon={timeOutline} slot="start" />
                <IonLabel>
                  <h2>{item.device}</h2>
                  <p>{item.location}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </IonLabel>
                {item.current && (
                  <IonBadge color="success" slot="end">
  {t('auto.page.Current')}
</IonBadge>
                )}
              </IonItem>
            ))}
            
            <IonItem button onClick={handleLogoutAllDevices}>
              <IonIcon icon={lockClosedOutline} slot="start" color="danger" />
              <IonLabel color="danger">
  {t('auto.page.LogoutA')}
</IonLabel>
            </IonItem>
          </IonItemGroup>
        </IonList>
        
        <div className="p-4">
          <FormSaveButton loading={isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Changes'}
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