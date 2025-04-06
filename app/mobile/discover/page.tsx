'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { useServices } from '@/core/hooks/useServices';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

// Add type definition for Photo
interface Photo {
  url: string;
  id: string;
}

interface Match {
  users: string[];
}

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
  const router = useRouter();
  const { userService, isLoading, error } = useServices();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  
  useEffect(() => {
    loadRecommendedUsers();
  }, [userService]);
  
  const loadRecommendedUsers = async () => {
    if (!userService) return;
    
    try {
      const allUsers = await userService.getUsers();
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) {
        setToastMessage('Please login first');
        setShowToast(true);
        return;
      }

      // Filter out current user and already matched users
      let matchedUserIds: string[] = [];
      try {
        const matches: Match[] = await userService.getMatches(currentUser.id);
        matchedUserIds = matches.flatMap(match => match.users);
      } catch (err) {
        console.log('getMatches is not available', err);
      }
      
      // Filter users based on preferences
      const filteredUsers = allUsers.filter(user => 
        user.id !== currentUser.id && 
        !matchedUserIds.includes(user.id)
      );
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading recommended users:', err);
      setToastMessage('Failed to load recommendations. Please try again.');
      setShowToast(true);
    }
  };
  
  const handleLike = async () => {
    handleSwipe('right');
  };

  const handleDislike = async () => {
    handleSwipe('left');
  };
  
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!userService) return;
    
    const currentUser = await userService.getCurrentUser();
    if (!currentUser) {
      setToastMessage('Please login first');
      setShowToast(true);
      return;
    }

    const swipedUser = users[currentIndex];
    if (!swipedUser) return;

    if (direction === 'right') {
      try {
        const match = await userService.createMatch([currentUser.id, swipedUser.id]);
        if (match) {
          setMatchedUser(swipedUser);
          setShowMatch(true);
          return;
        }
      } catch (err) {
        console.error('Error creating match:', err);
        setToastMessage('Failed to create match');
        setShowToast(true);
      }
    }
    
    goToNextProfile();
  };
  
  const goToNextProfile = () => {
    setSwipeDirection(null);
    if (currentIndex < users.length - 1) {
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

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading recommendations..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadRecommendedUsers} />
        </IonContent>
      </IonPage>
    );
  }
  
  const currentUser = users[currentIndex];
  
  return (
    <IonPage>
      <IonContent className="bg-[#0f172a]">
        {showMatch ? (
          <div className="fixed inset-0 bg-opacity-90 bg-gray-900 z-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm mx-auto">
              <h1 className="text-3xl font-bold text-pink-500 mb-4">It&apos;s a Match!</h1>
              <p className="text-white mb-6">You and {matchedUser?.name} have liked each other</p>
              
              <div className="flex justify-center space-x-4 mb-8">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white">
                    <Image 
                      src="/assets/images/avatar-placeholder.jpg"
                      alt="Your profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white">
                    <Image 
                      src={matchedUser?.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                      alt={matchedUser?.name || 'Match'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold"
                >
                  Send Message
                </button>
                
                <button
                  onClick={handleKeepSwiping}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold"
                >
                  Keep Swiping
                </button>
              </div>
            </div>
          </div>
        ) : currentUser ? (
          // Profile card
          <div className="h-full flex flex-col">
            <div 
              ref={cardRef}
              className="flex-1 relative mx-4 my-4 rounded-xl overflow-hidden bg-white shadow-xl transition-transform duration-300"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="absolute inset-0">
                <Image
                  src={currentUser.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentUser.name}, {calculateAge(new Date(currentUser.birthDate))}
                </h2>
                <p className="text-gray-200">{currentUser.bio}</p>
              </div>
              
              {swipeDirection && (
                <div className={`absolute top-8 ${swipeDirection === 'right' ? 'right-8' : 'left-8'} p-4 rounded-lg border-4 ${
                  swipeDirection === 'right' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                }`}>
                  {swipeDirection === 'right' ? 'LIKE' : 'NOPE'}
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-8 p-4">
              <button
                onClick={handleDislike}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
              >
                <span className="text-3xl">✕</span>
              </button>
              
              <button
                onClick={handleLike}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
              >
                <span className="text-3xl">♥</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">No more profiles</h2>
              <p className="text-gray-400">Check back later for new recommendations</p>
            </div>
          </div>
        )}
        
        <BottomNavBar />
      </IonContent>
      
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