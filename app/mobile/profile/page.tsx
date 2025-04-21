'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonToast
} from '@ionic/react';
import { settingsOutline, pencilOutline } from 'ionicons/icons';
import { useUser } from '@/core/hooks/useUser';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ProfilePage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const {
    user,
    loading,
    fetchError,
    updateError,
    deleteError,
    isAuthenticated,
    empty,
    updateUser,
    deleteUser,
    reloadUser,
  } = useUser();

  // 新增：未登录时自动跳转登录页
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mobile/auth/login');
    }
  }, [loading, user, router]);

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  const handleSettings = () => {
    router.push('/mobile/settings');
  };

  const handleRetry = () => {
    reloadUser();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }

  if (fetchError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={fetchError.message} onRetry={handleRetry} />
        </IonContent>
      </IonPage>
    );
  }

  // 已登录但 user 为空时不再渲染空数据提示，而是自动跳转
  if (!user) {
    return null;
  }

  // Calculate age from birthDate
  const age = user.birthDate ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / 31557600000) : null;
  
  // Format location
  const locationText = user.location ? `${user.location.city}, ${user.location.country}` : 'Not specified';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle{t('auto.page.')}/IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSettings}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
            <IonButton onClick={handleEditProfile}>
              <IonIcon icon={pencilOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-[#0f172a]">
        {/* 用户信息展示 */}
        <div className="max-w-md mx-auto p-4">
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-lg overflow-hidden">
              {user.photos && user.photos.length > 0 ? (
                <img 
                  src={user.photos[0].url} 
                  alt={t('auto.page.Cover')} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600" />
              )}
            </div>
            
            <div className="absolute -bottom-12 left-4">
              <div className="w-24 h-24 border-4 border-white rounded-full overflow-hidden">
                {user.photos && user.photos.length > 0 ? (
                  <img 
                    src={user.photos[0].url} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    <span className="text-2xl text-gray-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-16 space-y-4 text-white">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-300">{user.bio || 'No bio yet'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-sm font-medium text-gray-400"{t('auto.page.Age')}/h2>
                <p>{age || 'Not specified'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400"{t('auto.page.Location')}/h2>
                <p>{locationText}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400"{t('auto.page.Gender')}/h2>
                <p>{user.gender || 'Not specified'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-400"{t('auto.page.Looking')}/h2>
                <p>{user.preferences?.gender?.join(', ') || 'Not specified'}</p>
              </div>
            </div>
            
            {user.interests && user.interests.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-2"{t('auto.page.Interest')}/h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {updateError && <div className="text-red-500 text-center text-xs mb-2">{updateError.message}</div>}
        {deleteError && <div className="text-red-500 text-center text-xs mb-2">{deleteError.message}</div>}
        {/* 底部导航栏 */}
        <BottomNavBar />
      </IonContent>
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
}