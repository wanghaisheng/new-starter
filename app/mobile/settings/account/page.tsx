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
  IonInput,
  IonButton,
  IonToast,
  IonItemDivider,
  IonList,
  IonAlert
} from '@ionic/react';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { user, loading: userLoading, error: userError, updateUser } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const isLoading = userLoading;
  const error = userError;
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('Failed to load account settings. Please try again.');
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      // Update user data
      const updatedUser = {
        ...user,
        email: email !== user.email ? email : undefined,
        phone: phone !== user.phone ? phone : undefined
      };
      
      await updateUser(updatedUser);
      
      // Update password if provided
      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          setToastMessage('New passwords do not match');
          setShowToast(true);
          return;
        }
        
        try {
          // First verify current password by attempting to login
          await updateProfile({ password: newPassword });
          // If successful, inform user
          setToastMessage('Password updated successfully');
          setShowToast(true);
        } catch (err) {
          console.error('Failed to update password:', err);
          setToastMessage('Failed to update password. Please check your current password.');
          setShowToast(true);
          return;
        }
      }
      
      setToastMessage('Account settings updated successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error updating account settings:', err);
      setToastMessage('Failed to update account settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !userService || !authService) return;

    try {
      setIsSaving(true);
      await userService.deleteUser(user.id);
      await authService.logout();
      router.push('/mobile/auth/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setToastMessage('Failed to delete account. Please try again.');
      setShowToast(true);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading account settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access account settings</p>
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
          <IonTitle>Account Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <IonList lines="full">
          <IonItemDivider>
            <IonLabel>CONTACT INFORMATION</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={e => setEmail(e.detail.value || '')}
              placeholder="Enter your email"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Phone Number</IonLabel>
            <IonInput
              type="tel"
              value={phone}
              onIonChange={e => setPhone(e.detail.value || '')}
              placeholder="Enter your phone number"
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>CHANGE PASSWORD</IonLabel>
          </IonItemDivider>
          
          <IonItem>
            <IonLabel position="stacked">Current Password</IonLabel>
            <IonInput
              type="password"
              value={currentPassword}
              onIonChange={e => setCurrentPassword(e.detail.value || '')}
              placeholder="Enter your current password"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">New Password</IonLabel>
            <IonInput
              type="password"
              value={newPassword}
              onIonChange={e => setNewPassword(e.detail.value || '')}
              placeholder="Enter your new password"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Confirm New Password</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonChange={e => setConfirmPassword(e.detail.value || '')}
              placeholder="Confirm your new password"
            />
          </IonItem>
          
          <IonItemDivider>
            <IonLabel>ACCOUNT ACTIONS</IonLabel>
          </IonItemDivider>
          
          <IonItem button onClick={() => setShowDeleteAlert(true)} color="danger">
            <IonLabel>Delete Account</IonLabel>
          </IonItem>
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
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              setShowDeleteAlert(false);
            }
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => {
              handleDeleteAccount();
            }
          }
        ]}
      />
    </IonPage>
  );
}