'use client';

import { useRouter } from 'next/navigation';
import { 
  IonBackButton, 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonToggle,
  IonItemDivider,
  IonAvatar,
  IonBadge,
  IonNote,
  IonAlert,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCard,
  IonCardContent,
  IonToast
} from '@ionic/react';
import { 
  chevronForwardOutline, 
  personCircleOutline,
  notificationsOutline,
  lockClosedOutline,
  helpCircleOutline,
  mailOutline,
  informationCircleOutline,
  documentTextOutline,
  shieldOutline,
  logOutOutline,
  moonOutline,
  starOutline
} from 'ionicons/icons';
import Image from 'next/image';
import { useState } from 'react';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useApi } from '@/core/hooks/useApi';
import { apiClient } from '@/utils/api-client';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function SettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { 
    data: user,
    loading: isLoading,
    error,
    execute: fetchProfile,
    networkStatus
  } = useApi<User>(
    () => apiClient.getCurrentUser(),
    {
      immediate: true,
      offlineFirst: true,
      requireAuth: true
    }
  );

  const handleAccountPress = () => {
    router.push('/mobile/settings/account');
  };

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };
  
  const confirmLogout = async () => {
    try {
      await apiClient.logout();
      router.push('/mobile/auth/login');
    } catch (err) {
      console.error('Failed to logout:', err);
      setToastMessage('Failed to logout. Please try again.');
      setShowToast(true);
    }
  };

  const handleRetry = () => {
    fetchProfile(() => apiClient.getCurrentUser());
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={handleRetry} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4"{t('auto.page.Noprofi')}/p>
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
          <IonTitle{t('auto.page.Settings')}/IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Profile Section */}
        <IonCard className="mb-4">
          <IonCardContent>
            <div className="flex items-center space-x-4">
              {user.photos?.[0]?.url ? (
                <Image
                  src={user.photos[0].url}
                  alt={t('auto.page.Profile')}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              ) : (
                <IonAvatar>
                  <IonIcon icon={personCircleOutline} className="w-full h-full" />
                </IonAvatar>
              )}
              <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button 
                onClick={handleEditProfile}
                className="ml-auto text-primary-600"
              >
                Edit
              </button>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Settings List */}
        <IonList>
          <IonItem button detail onClick={handleAccountPress}>
            <IonIcon icon={personCircleOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Account')}/IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/notifications">
            <IonIcon icon={notificationsOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Notifica')}/IonLabel>
            {user.unreadNotifications && user.unreadNotifications > 0 && (
              <IonBadge slot="end" color="danger">
                {user.unreadNotifications}
              </IonBadge>
            )}
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/privacy">
            <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Privacy')}/IonLabel>
          </IonItem>
          
          <IonItem>
            <IonIcon icon={moonOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.DarkMod')}/IonLabel>
            <IonToggle 
              checked={darkMode}
              onIonChange={e => setDarkMode(e.detail.checked)}
            />
          </IonItem>
        </IonList>

        <IonList>
          <IonItem button detail routerLink="/mobile/settings/help">
            <IonIcon icon={helpCircleOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.GetHelp')}/IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/contact">
            <IonIcon icon={mailOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Contact')}/IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/about">
            <IonIcon icon={informationCircleOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.About')}/IonLabel>
            <IonNote slot="end" color="medium"{t('auto.page.v100')}/IonNote>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/terms">
            <IonIcon icon={documentTextOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Termsof')}/IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/privacy-policy">
            <IonIcon icon={shieldOutline} slot="start" color="medium" />
            <IonLabel{t('auto.page.Privacy')}/IonLabel>
          </IonItem>
        </IonList>
        
        {/* Logout button */}
        <div className="ion-padding">
          <IonItem 
            button 
            lines="none" 
            className="ion-margin-top"
            color="danger"
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            <IonLabel{t('auto.page.LogOut')}/IonLabel>
          </IonItem>
        </div>

        {/* Alerts and Toasts */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={t('auto.page.Confirm')}
          message={t('auto.page.Areyou')}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Log Out',
              role: 'destructive',
              handler: confirmLogout
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />

        {networkStatus === 'offline' && (
          <div className="fixed bottom-16 left-0 right-0 bg-yellow-500 text-black py-2 px-4 text-center">
            You're offline. Some features may be limited.
          </div>
        )}
      </IonContent>
      
      <BottomNavBar />
    </IonPage>
  );
}
