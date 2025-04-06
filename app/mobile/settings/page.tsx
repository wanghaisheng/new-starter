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
import { useState, useEffect } from 'react';
import { useServices } from '@/core/hooks/useServices';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function SettingsPage() {
  const router = useRouter();
  const { userService, authService, isLoading, error } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, [userService]);

  const loadUserProfile = async () => {
    if (!userService) return;

    try {
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setToastMessage('Failed to load profile. Please try again.');
      setShowToast(true);
    }
  };

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
    if (!authService) return;

    try {
      await authService.logout();
      router.push('/mobile/auth/login');
    } catch (err) {
      console.error('Failed to logout:', err);
      setToastMessage('Failed to logout. Please try again.');
      setShowToast(true);
    }
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
          <ErrorDisplay error={error.toString()} onRetry={loadUserProfile} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        {/* Account section */}
        <IonItemDivider className="ion-padding-start">
          <IonLabel color="medium">ACCOUNT</IonLabel>
        </IonItemDivider>
        
        <IonList lines="full">
          <IonItem button detail onClick={handleAccountPress}>
            <IonAvatar slot="start">
              {user?.photos && user.photos.length > 0 ? (
                <Image 
                  src={user.photos[0].url} 
                  alt={user.name} 
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xl text-gray-300">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </IonAvatar>
            <IonLabel>
              <h2>{user?.name || 'Guest'}</h2>
              <p>Member</p>
            </IonLabel>
            {user?.isVerified && (
              <IonBadge color="primary" slot="end">VERIFIED</IonBadge>
            )}
          </IonItem>
          
          <IonItem button detail onClick={handleEditProfile}>
            <IonIcon icon={personCircleOutline} slot="start" color="medium" />
            <IonLabel>Edit Profile</IonLabel>
          </IonItem>
        </IonList>
        
        {/* Preferences section */}
        <IonItemDivider className="ion-padding-start">
          <IonLabel color="medium">PREFERENCES</IonLabel>
        </IonItemDivider>
        
        <IonList lines="full">
          <IonItem button detail routerLink="/mobile/settings/discovery">
            <IonIcon icon={starOutline} slot="start" color="medium" />
            <IonLabel>Discovery Settings</IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/notifications">
            <IonIcon icon={notificationsOutline} slot="start" color="medium" />
            <IonLabel>Notification Settings</IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/privacy">
            <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
            <IonLabel>Privacy Settings</IonLabel>
          </IonItem>
          
          <IonItem>
            <IonIcon icon={moonOutline} slot="start" color="medium" />
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle 
              slot="end" 
              checked={darkMode} 
              onIonChange={(e) => setDarkMode(e.detail.checked)} 
            />
          </IonItem>
        </IonList>
        
        {/* Support section */}
        <IonItemDivider className="ion-padding-start">
          <IonLabel color="medium">SUPPORT</IonLabel>
        </IonItemDivider>
        
        <IonList lines="full">
          <IonItem button detail routerLink="/mobile/settings/help">
            <IonIcon icon={helpCircleOutline} slot="start" color="medium" />
            <IonLabel>Get Help</IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/contact">
            <IonIcon icon={mailOutline} slot="start" color="medium" />
            <IonLabel>Contact Us</IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/about">
            <IonIcon icon={informationCircleOutline} slot="start" color="medium" />
            <IonLabel>About</IonLabel>
            <IonNote slot="end" color="medium">v1.0.0</IonNote>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/terms">
            <IonIcon icon={documentTextOutline} slot="start" color="medium" />
            <IonLabel>Terms of Service</IonLabel>
          </IonItem>
          
          <IonItem button detail routerLink="/mobile/settings/privacy-policy">
            <IonIcon icon={shieldOutline} slot="start" color="medium" />
            <IonLabel>Privacy Policy</IonLabel>
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
            <IonLabel>Log Out</IonLabel>
          </IonItem>
        </div>
      </IonContent>
      
      <IonAlert
        isOpen={showLogoutAlert}
        onDidDismiss={() => setShowLogoutAlert(false)}
        header="Confirm Logout"
        message="Are you sure you want to log out?"
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
      
      <BottomNavBar />
    </IonPage>
  );
}
