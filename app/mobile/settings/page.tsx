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
  IonCardContent
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
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleAccountPress = () => {
    router.push('/mobile/settings/account');
  };

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };
  
  const confirmLogout = () => {
    // Implement logout logic
    router.push('/mobile');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding-vertical">
        {/* Account section */}
        <IonItemDivider className="ion-padding-start">
          <IonLabel color="medium">ACCOUNT</IonLabel>
        </IonItemDivider>
        
        <IonList lines="full">
          <IonItem button detail onClick={handleAccountPress}>
            <IonAvatar slot="start">
              <Image 
                src="/assets/images/avatar-placeholder.jpg" 
                alt="Profile" 
                width={48}
                height={48}
                className="object-cover"
              />
            </IonAvatar>
            <IonLabel>
              <h2>Jessica</h2>
              <p>Premium Member</p>
            </IonLabel>
            <IonBadge color="primary" slot="end">PRO</IonBadge>
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
      
      <BottomNavBar />
    </IonPage>
  );
}
