'use client';

import { useRouter } from 'next/navigation';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function SettingsPage() {
  const router = useRouter();

  const handleAccountPress = () => {
    router.push('/mobile/settings/account');
  };

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  const handleLogout = () => {
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
      
      <IonContent>
        <div className="py-4 pb-20">
          {/* Account section */}
          <div className="px-4 mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">ACCOUNT</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center p-4" onClick={handleAccountPress}>
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-3">
                  <Image 
                    src="/assets/images/avatar-placeholder.jpg" 
                    alt="Profile" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Jessica</h3>
                  <p className="text-sm text-gray-500">Premium Member</p>
                </div>
                <IonIcon icon={chevronForwardOutline} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Profile settings */}
          <div className="mb-6">
            <div onClick={handleEditProfile} className="px-4 py-3 bg-white border-b flex items-center justify-between">
              <h3 className="font-medium">Edit Profile</h3>
              <IonIcon icon={chevronForwardOutline} className="text-gray-400" />
            </div>
          </div>
          
          {/* Preferences section */}
          <div className="px-4 mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">PREFERENCES</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <IonList lines="none">
                <IonItem detail={true} routerLink="/mobile/settings/discovery">
                  <IonLabel>Discovery Settings</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/notifications">
                  <IonLabel>Notification Settings</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/privacy">
                  <IonLabel>Privacy Settings</IonLabel>
                </IonItem>
              </IonList>
            </div>
          </div>
          
          {/* Support section */}
          <div className="px-4 mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">SUPPORT</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <IonList lines="none">
                <IonItem detail={true} routerLink="/mobile/settings/help">
                  <IonLabel>Get Help</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/contact">
                  <IonLabel>Contact Us</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/about">
                  <IonLabel>About</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/terms">
                  <IonLabel>Terms of Service</IonLabel>
                </IonItem>
                <IonItem detail={true} routerLink="/mobile/settings/privacy-policy">
                  <IonLabel>Privacy Policy</IonLabel>
                </IonItem>
              </IonList>
            </div>
          </div>
          
          {/* Logout button */}
          <div className="px-4 mb-8">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium"
            >
              Log Out
            </button>
          </div>
          
          {/* App version */}
          <div className="text-center text-xs text-gray-400 mb-8">
            Version 1.0.0
          </div>
        </div>
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
}
