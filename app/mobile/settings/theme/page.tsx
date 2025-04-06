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
  IonRadio,
  IonRadioGroup,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { 
  moonOutline, 
  sunnyOutline, 
  colorPaletteOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { useServices } from '@/core/hooks/useServices';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { userService, isLoading, error } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('pink');

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
      
      // Load theme preferences from user settings or use defaults
      setIsDarkMode(currentUser.preferences?.theme?.darkMode ?? true);
      setAccentColor(currentUser.preferences?.theme?.accentColor ?? 'pink');
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('Failed to load theme settings. Please try again.');
      setShowToast(true);
    }
  };

  const handleSave = async () => {
    if (!user || !userService) return;

    try {
      setIsSaving(true);
      
      // Update user preferences with the theme settings
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          theme: {
            darkMode: isDarkMode,
            accentColor
          }
        }
      };
      
      await userService.updateUser(user.id, updatedUser);
      setToastMessage('Theme settings saved successfully');
      setShowToast(true);
      
      // Apply theme changes
      applyThemeChanges();
    } catch (err) {
      console.error('Error saving theme settings:', err);
      setToastMessage('Failed to save theme settings. Please try again.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const applyThemeChanges = () => {
    // Apply dark mode
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    // Apply accent color
    const root = document.documentElement;
    root.style.setProperty('--ion-color-primary', getColorValue(accentColor));
    root.style.setProperty('--ion-color-primary-rgb', getColorRGB(accentColor));
  };

  const getColorValue = (color: string): string => {
    const colors: Record<string, string> = {
      pink: '#ec4899',
      blue: '#3b82f6',
      purple: '#8b5cf6',
      green: '#10b981',
      orange: '#f97316',
      red: '#ef4444',
      teal: '#14b8a6',
      indigo: '#6366f1'
    };
    return colors[color] || '#ec4899';
  };

  const getColorRGB = (color: string): string => {
    const rgbValues: Record<string, string> = {
      pink: '236, 72, 153',
      blue: '59, 130, 246',
      purple: '139, 92, 246',
      green: '16, 185, 129',
      orange: '249, 115, 22',
      red: '239, 68, 68',
      teal: '20, 184, 166',
      indigo: '99, 102, 241'
    };
    return rgbValues[color] || '236, 72, 153';
  };

  const colorOptions = [
    { name: 'Pink', value: 'pink' },
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Green', value: 'green' },
    { name: 'Orange', value: 'orange' },
    { name: 'Red', value: 'red' },
    { name: 'Teal', value: 'teal' },
    { name: 'Indigo', value: 'indigo' }
  ];

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading theme settings..." />
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
            <p className="text-gray-400 mb-4">Please login to access theme settings</p>
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
          <IonTitle>Theme Settings</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="p-4">
          <p className="text-gray-400 mb-4">
            Customize the appearance of the app to match your preferences.
          </p>
        </div>
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>APPEARANCE</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={moonOutline} slot="start" />
              <IonLabel>Dark Mode</IonLabel>
              <IonToggle
                checked={isDarkMode}
                onIonChange={e => setIsDarkMode(e.detail.checked)}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={sunnyOutline} slot="start" />
              <IonLabel>Light Mode</IonLabel>
              <IonToggle
                checked={!isDarkMode}
                onIonChange={e => setIsDarkMode(!e.detail.checked)}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>ACCENT COLOR</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={colorPaletteOutline} slot="start" />
              <IonLabel>Choose a color theme</IonLabel>
            </IonItem>
            
            <div className="p-4 grid grid-cols-4 gap-4">
              {colorOptions.map(color => (
                <div 
                  key={color.value}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center ${
                      accentColor === color.value ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: getColorValue(color.value) }}
                    onClick={() => setAccentColor(color.value)}
                  >
                    {accentColor === color.value && (
                      <IonIcon icon={checkmarkOutline} className="text-white text-xl" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-300">{color.name}</span>
                </div>
              ))}
            </div>
          </IonItemGroup>
        </IonList>
        
        <div className="p-4">
          <IonCard className="bg-slate-800">
            <IonCardContent>
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: getColorValue(accentColor) }}
                />
                <div className="flex-1">
                  <div className="h-2 w-3/4 rounded mb-2" style={{ backgroundColor: getColorValue(accentColor) }} />
                  <div className="h-2 w-1/2 rounded" style={{ backgroundColor: getColorValue(accentColor) }} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
        
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