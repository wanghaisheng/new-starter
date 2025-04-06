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
import { useServices } from '@/core/hooks/useServices';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { userService, authService, isLoading, error } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [showTwoFactorAlert, setShowTwoFactorAlert] = useState(false);
  const [showLogoutAllAlert, setShowLogoutAllAlert] = useState(false);
  
  // Mock login history data
  const [loginHistory, setLoginHistory] = useState([
    { id: 1, device: 'iPhone 13', location: 'New York, USA', date: '2023-04-05 14:30', current: true },
    { id: 2, device: 'MacBook Pro', location: 'New York, USA', date: '2023-04-03 09:15', current: false },
    { id: 3, device: 'Samsung Galaxy S21', location: 'Boston, USA', date: '2023-03-28 18:45', current: false },
    { id: 4, device: 'iPad Pro', location: 'Chicago, USA', date: '2023-03-15 11:20', current: false }
  ]);

  useEffect(() => {
    loadUserData();
  }, [userService]);

  const loadUserData = async () => {
    if (!userService) return;

    try {
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setToastMessage('Please login first');
        setShowToast(true);
        return;
      }
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('Failed to load security settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      
      // Update user security settings
      const updatedUser = {
        ...user,
        securitySettings: {
          ...user.securitySettings,
          twoFactorEnabled: user.securitySettings?.twoFactorEnabled || false,
          emailNotifications: user.securitySettings?.emailNotifications || false,
          loginAlerts: user.securitySettings?.loginAlerts || false
        }
      };
      
      await userService.updateUser(user.id, updatedUser);
      setToastMessage('Security settings saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving security settings:', err);
      setToastMessage('Failed to save security settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordAlert(true);
  };

  const handleEnableTwoFactor = () => {
    setShowTwoFactorAlert(true);
  };

  const handleLogoutAllDevices = () => {
    setShowLogoutAllAlert(true);
  };

  const confirmLogoutAllDevices = async () => {
    if (!authService) return;

    try {
      // In a real app, this would call an API to invalidate all sessions
      setToastMessage('Logged out from all devices');
      setShowToast(true);
      
      // Refresh login history to show only current device
      setLoginHistory(loginHistory.map(item => ({ ...item, current: item.id === 1 })));
    } catch (err) {
      console.error('Error logging out from all devices:', err);
      setToastMessage('Failed to logout from all devices. Please try again.');
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading security settings..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadUserData} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">Please login to access security settings</p>
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
          <IonTitle>Security Settings</IonTitle>
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
              <IonLabel>ACCOUNT SECURITY</IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={handleChangePassword}>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel>Change Password</IonLabel>
              <IonNote slot="end" color="medium">Last changed 3 months ago</IonNote>
            </IonItem>
            
            <IonItem button onClick={handleEnableTwoFactor}>
              <IonIcon icon={phonePortraitOutline} slot="start" />
              <IonLabel>Two-Factor Authentication</IonLabel>
              <IonToggle 
                slot="end" 
                checked={user.securitySettings?.twoFactorEnabled || false} 
                onIonChange={() => handleEnableTwoFactor()} 
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>SECURITY NOTIFICATIONS</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel>Email Notifications</IonLabel>
              <IonToggle 
                slot="end" 
                checked={user.securitySettings?.emailNotifications || false} 
                onIonChange={(e) => {
                  if (!user) return;
                  setUser({
                    ...user,
                    securitySettings: {
                      ...user.securitySettings,
                      emailNotifications: e.detail.checked
                    }
                  });
                }} 
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={warningOutline} slot="start" />
              <IonLabel>Login Alerts</IonLabel>
              <IonToggle 
                slot="end" 
                checked={user.securitySettings?.loginAlerts || false} 
                onIonChange={(e) => {
                  if (!user) return;
                  setUser({
                    ...user,
                    securitySettings: {
                      ...user.securitySettings,
                      loginAlerts: e.detail.checked
                    }
                  });
                }} 
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>LOGIN HISTORY</IonLabel>
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
                  <IonBadge color="success" slot="end">Current</IonBadge>
                )}
              </IonItem>
            ))}
            
            <IonItem button onClick={handleLogoutAllDevices}>
              <IonIcon icon={lockClosedOutline} slot="start" color="danger" />
              <IonLabel color="danger">Logout All Devices</IonLabel>
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
      
      <IonAlert
        isOpen={showPasswordAlert}
        onDidDismiss={() => setShowPasswordAlert(false)}
        header="Change Password"
        message="You will be redirected to the password change page."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'alert-button-cancel'
          },
          {
            text: 'Continue',
            cssClass: 'alert-button-confirm',
            handler: () => {
              router.push('/mobile/settings/account');
            }
          }
        ]}
      />
      
      <IonAlert
        isOpen={showTwoFactorAlert}
        onDidDismiss={() => setShowTwoFactorAlert(false)}
        header="Two-Factor Authentication"
        message="Would you like to enable two-factor authentication? This will require a verification code sent to your phone or email when you log in."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'alert-button-cancel'
          },
          {
            text: 'Enable',
            cssClass: 'alert-button-confirm',
            handler: () => {
              if (!user) return;
              setUser({
                ...user,
                securitySettings: {
                  ...user.securitySettings,
                  twoFactorEnabled: true
                }
              });
              setToastMessage('Two-factor authentication enabled');
              setShowToast(true);
            }
          }
        ]}
      />
      
      <IonAlert
        isOpen={showLogoutAllAlert}
        onDidDismiss={() => setShowLogoutAllAlert(false)}
        header="Logout All Devices"
        message="This will log you out from all devices except the current one. Are you sure you want to continue?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'alert-button-cancel'
          },
          {
            text: 'Logout All',
            cssClass: 'alert-button-confirm',
            handler: () => {
              confirmLogoutAllDevices();
            }
          }
        ]}
      />
    </IonPage>
  );
} 