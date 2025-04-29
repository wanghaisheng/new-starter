'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { Photo } from '@/core/lib/db/types/photo';
import { Match } from '@/core/lib/db/types/match';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useApi } from '@/core/hooks/useApi';
import { apiClient } from '@/utils/api-client';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { MatchPreferenceButton } from './MatchPreferenceButton';

// Add utility function to calculate age from birthDate
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default function DiscoverPage() {
  useRequireAuth();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // 统一通过 useApi + apiClient 获取推荐用户
  const {
    data: users,
    loading: isLoading,
    error,
    execute: fetchUsers,
    networkStatus
  } = useApi<User[]>(
    async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        if (!currentUser) {
          throw new Error('请先登录');
        }
        const allUsers = await apiClient.getUsers();
        const matches = await apiClient.getUserMatches();
        const matchedUserIds = matches.flatMap((match: Match) => match.users);
        // 过滤掉自己和已匹配用户
        return allUsers.filter((user: User) => 
          user.id !== currentUser.id && 
          !matchedUserIds.includes(user.id)
        );
      } catch (err: any) {
        throw new Error(err.message || '获取推荐用户失败');
      }
    },
    {
      immediate: true,
      offlineFirst: true,
      requireAuth: true
    }
  );
  
  const handleLike = async () => {
    handleSwipe('right');
  };

  const handleDislike = async () => {
    handleSwipe('left');
  };
  
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!users) return;
    
    const currentUser = await apiClient.getCurrentUser();
    if (!currentUser) {
      setToastMessage('请先登录');
      setShowToast(true);
      return;
    }

    const swipedUser = users[currentIndex];
    if (!swipedUser) return;

    if (direction === 'right') {
      try {
        const match = await apiClient.createMatch([currentUser.id, swipedUser.id]);
        if (match) {
          setMatchedUser(swipedUser);
          setShowMatch(true);
          return;
        }
      } catch (err) {
        console.error('Error creating match:', err);
        setToastMessage('匹配失败');
        setShowToast(true);
      }
    }
    
    goToNextProfile();
  };
  
  const goToNextProfile = () => {
    setSwipeDirection(null);
    if (users && currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const card = cardRef.current;
    
    card.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
    
    if (diff > 50) {
      setSwipeDirection('right');
    } else if (diff < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    
    if (swipeDirection === 'right') {
      card.style.transform = 'translateX(1000px) rotate(30deg)';
      handleLike();
    } else if (swipeDirection === 'left') {
      card.style.transform = 'translateX(-1000px) rotate(-30deg)';
      handleDislike();
    } else {
      card.style.transform = 'translateX(0) rotate(0)';
    }
    
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.transition = 'none';
        cardRef.current.style.transform = 'translateX(0) rotate(0)';
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.3s ease';
          }
        }, 50);
      }
    }, 300);
  };

  const handleSendMessage = () => {
    setShowMatch(false);
    router.push('/mobile/matches/chat');
  };

  const handleKeepSwiping = () => {
    setShowMatch(false);
    goToNextProfile();
  };

  const handleRetry = () => {
    fetchUsers(() => apiClient.getUsers());
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading') || '加载中...'} />
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

  if (!users || users.length === 0) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">
              {t('auto.page.Nomore') || '暂无更多推荐'}
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              {t('auto.page.Reload') || '重新加载'}
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  const currentUser = users[currentIndex];
  
  return (
    <IonPage>
      <IonContent className="bg-[#0f172a]">
        {/* 匹配优先项设置按钮 */}
        <MatchPreferenceButton />
        {showMatch ? (
          <div className="fixed inset-0 bg-opacity-90 bg-gray-900 z-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm mx-auto">
              <h1 className="text-3xl font-bold text-pink-500 mb-4">
                {t('auto.page.MatchSuccess') || '配对成功'}
              </h1>
              <p className="text-white mb-6">您和 {matchedUser?.name} 都喜欢对方</p>
              
              <div className="flex justify-center space-x-4 mb-8">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white">
                    <Image 
                      src="/assets/images/avatar-placeholder.jpg"
                      alt={t('auto.page.AvatarAlt') || '用户头像'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white">
                    <Image 
                      src={matchedUser?.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                      alt={matchedUser?.name || '匹配用户'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleKeepSwiping}
                  className="px-6 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  {t('auto.page.KeepSwiping') || '继续滑动'}
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                >
                  {t('auto.page.SendMessage') || '发送消息'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <div
              ref={cardRef}
              className="absolute inset-0 m-4 bg-white rounded-xl overflow-hidden shadow-lg transition-transform duration-300"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative h-[70vh]">
                <Image
                  src={currentUser.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-bold">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.bio}</p>
                
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={handleDislike}
                    className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center"
                  >
                    ♥
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {networkStatus === 'offline' && (
          <div className="fixed bottom-16 left-0 right-0 bg-yellow-500 text-black py-2 px-4 text-center">
            {t('auto.page.Offline') || '您当前处于离线状态，部分功能可能不可用。'}
          </div>
        )}
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