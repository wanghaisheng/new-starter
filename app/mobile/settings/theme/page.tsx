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
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useToast } from '@/core/hooks/useToast';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { FormSaveButton } from '@/core/components/form/FormSaveButton';
import { ThemeSettings } from '@/core/types/settings';
import { useSetting } from '@/core/hooks/useSetting';

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { user, loading, updateError } = useUser();
  const { triggerToast, showToast, toastMessage, setShowToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { theme, loading: themeLoading, error: themeError, empty, updateTheme: updateThemeSetting } = useSetting(user?.id || '');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    darkMode: true,
    accentColor: 'pink'
  });

  // 加载主题设置数据
  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load theme preferences from user settings or use defaults
      setThemeSettings({
        darkMode: user.preferences?.theme?.darkMode ?? true,
        accentColor: user.preferences?.theme?.accentColor ?? 'pink'
      });
    } catch (err) {
      console.error('Error loading user data:', err);
      triggerToast('Failed to load theme settings. Please try again.');
    }
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (theme) {
      setThemeSettings(theme);
    }
  }, [theme]);

  // 保存主题设置
  const handleSave = async () => {
    if (!user || !user.id) {
      triggerToast('User not found. Please login.');
      return;
    }
    setIsSaving(true);
    try {
      // 调用 useSetting hook 的 updateTheme
      await updateThemeSetting(themeSettings);
      triggerToast('Theme settings saved successfully');
    } catch (err) {
      console.error('Error saving theme settings:', err);
      triggerToast('Failed to save theme settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // 更新表单状态
  const updateTheme = (updates: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...updates }));
  };

  if (loading || themeLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (updateError || themeError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={updateError?.message || themeError?.message || ''} />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">
  {t('auto.page.Pleasel')}
</p>
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
          <IonTitle>
  {t('auto.page.ThemeSe')}
</IonTitle>
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
              <IonLabel>
  {t('auto.page.APPEARAN')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={moonOutline} slot="start" />
              <IonLabel>
  {t('auto.page.DarkMod')}
</IonLabel>
              <IonToggle
                checked={themeSettings.darkMode}
                onIonChange={e => updateTheme({ darkMode: e.detail.checked })}
              />
            </IonItem>
            
            <IonItem>
              <IonIcon icon={sunnyOutline} slot="start" />
              <IonLabel>
  {t('auto.page.LightMo')}
</IonLabel>
              <IonToggle
                checked={!themeSettings.darkMode}
                onIonChange={e => updateTheme({ darkMode: !e.detail.checked })}
              />
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.ACCENTC')}
</IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={colorPaletteOutline} slot="start" />
              <IonLabel>
  {t('auto.page.Choosea')}
</IonLabel>
            </IonItem>
            
            <div className="p-4 grid grid-cols-4 gap-4">
              {[
                { name: 'Pink', value: 'pink' },
                { name: 'Blue', value: 'blue' },
                { name: 'Purple', value: 'purple' },
                { name: 'Green', value: 'green' },
                { name: 'Orange', value: 'orange' },
                { name: 'Red', value: 'red' },
                { name: 'Teal', value: 'teal' },
                { name: 'Indigo', value: 'indigo' }
              ].map(color => (
                <div 
                  key={color.value}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center ${
                      themeSettings.accentColor === color.value ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: getColorValue(color.value) }}
                    onClick={() => updateTheme({ accentColor: color.value })}
                  >
                    {themeSettings.accentColor === color.value && (
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
              <h3 className="text-lg font-medium mb-2">
  {t('auto.page.Preview')}
</h3>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: getColorValue(themeSettings.accentColor) }}
                />
                <div className="flex-1">
                  <div className="h-2 w-3/4 rounded mb-2" style={{ backgroundColor: getColorValue(themeSettings.accentColor) }} />
                  <div className="h-2 w-1/2 rounded" style={{ backgroundColor: getColorValue(themeSettings.accentColor) }} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
        
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