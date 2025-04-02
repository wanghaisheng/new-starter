'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonContent, 
  IonPage, 
  IonSpinner,
  IonToast
} from '@ionic/react';
import Image from 'next/image';
import { User } from '@/core/lib/db/types/user';
import { UserService } from '@/core/services/user-service';
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

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  
  const userService = UserService.getInstance();
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await userService.getUsers();
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) {
        setError('Please login first');
        return;
      }

      // Filter out current user and already matched users
      let matchedUserIds: string[] = [];
      try {
        const matches: Match[] = await (userService as any).getMatches();
        matchedUserIds = matches.flatMap(match => match.users);
      } catch (err) {
        console.log('getMatches is not available', err);
      }
      
      const filteredUsers = allUsers.filter(user => 
        user.id !== currentUser.id && 
        !matchedUserIds.includes(user.id)
      );
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error loading user data');
      setToastMessage('Failed to load. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLike = async () => {
    handleSwipe('right');
  };

  const handleDislike = async () => {
    handleSwipe('left');
  };
  
  const handleSwipe = async (direction: 'left' | 'right') => {
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
        // Try to create a match
        try {
          await (userService as any).createMatch(currentUser.id, swipedUser.id);
          
          // 50% chance of a match for demo purposes
          const isMatch = Math.random() > 0.5;
          if (isMatch) {
            setMatchedUser(swipedUser);
            setShowMatch(true);
            return;
          }
        } catch {
          console.log('createMatch method not available or has different signature');
        }
      } catch (err) {
        console.error('Error creating match:', err);
        setToastMessage('Failed to create match');
        setShowToast(true);
      }
    }
    
    // Move to next user
    goToNextProfile();
  };
  
  const goToNextProfile = () => {
    setSwipeDirection(null);
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Start over when we reach the end for demo purposes
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
    
    // Reset card position after animation
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
          <div className="flex items-center justify-center h-full">
            <IonSpinner name="crescent" color="light" />
            <span className="ml-2 text-gray-300">Loading...</span>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <p className="text-red-400 mb-4 font-medium">{error}</p>
            <button 
              onClick={loadUsers}
              className="px-6 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 shadow-md"
            >
              Retry
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
        {showMatch ? (
          // Match screen
          <div className="fixed inset-0 bg-opacity-90 bg-gray-900 z-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm mx-auto">
              <h1 className="text-3xl font-bold text-secondary-500 mb-4">It's a Match!</h1>
              <p className="text-white mb-6">You and {matchedUser?.name} have liked each other</p>
              
              <div className="flex justify-center space-x-4 mb-8">
                <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-secondary-500">
                    <Image 
                      src="/assets/images/avatar-placeholder.jpg"
                      alt="Your profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-secondary-500">
                    <Image 
                      src={matchedUser?.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                      alt={matchedUser?.name || 'Match'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleSendMessage}
                  className="w-full bg-secondary-500 text-white py-3 px-4 rounded-md font-medium"
                >
                  Send Message
                </button>
                
                <button 
                  onClick={handleKeepSwiping}
                  className="w-full bg-gray-700 text-white py-3 px-4 rounded-md font-medium"
                >
                  Keep Swiping
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Main swiping interface
          <div className="flex flex-col h-full px-4 pt-4 pb-20">
            {/* Header with settings and profile buttons */}
            <div className="flex justify-between pb-4">
              <button className="w-10 h-10 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button className="w-10 h-10 rounded-full bg-white overflow-hidden" onClick={() => router.push('/mobile/profile')}>
                <Image 
                  src="/assets/images/avatar-placeholder.jpg"
                  alt="Your profile"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </button>
            </div>
            
            {/* Profile card */}
            {currentUser ? (
              <div 
                ref={cardRef}
                className="flex-1 relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 mb-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="absolute inset-0">
                  <Image
                    src={currentUser.photos?.[0]?.url || '/assets/images/profile-placeholder.jpg'}
                    alt={currentUser.name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70"></div>
                
                {/* Swipe direction indicators */}
                {swipeDirection === 'right' && (
                  <div className="absolute top-10 right-10 transform rotate-12">
                    <div className="text-green-500 border-4 border-green-500 rounded-md px-4 py-2 text-2xl font-bold">
                      LIKE
                    </div>
                  </div>
                )}
                
                {swipeDirection === 'left' && (
                  <div className="absolute top-10 left-10 transform -rotate-12">
                    <div className="text-red-500 border-4 border-red-500 rounded-md px-4 py-2 text-2xl font-bold">
                      PASS
                    </div>
                  </div>
                )}
                
                {/* Profile info */}
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h2 className="text-3xl font-bold">
                    {currentUser.name || 'User'}{currentUser.birthDate ? `, ${calculateAge(currentUser.birthDate)}` : ''}
                  </h2>
                  <p className="text-sm">
                    {typeof currentUser.location === 'string' 
                      ? `${currentUser.location}`
                      : currentUser.location 
                        ? `${currentUser.location.city || ''}, ${currentUser.location.country || ''}`
                        : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-6 bg-gray-800 rounded-xl shadow-lg max-w-xs mx-auto">
                  <div className="mb-4 text-secondary-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-white">No more profiles</h2>
                  <p className="text-gray-400 mb-6">Check back later!</p>
                  <button 
                    onClick={() => setCurrentIndex(0)}
                    className="w-full bg-secondary-500 text-white py-2 px-4 rounded-md font-medium"
                  >
                    Restart
                  </button>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            {currentUser && (
              <div className="flex justify-center py-6 space-x-12">
                <button 
                  onClick={handleDislike}
                  className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg"
                >
                  <svg className="w-8 h-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                
                <button 
                  onClick={handleLike}
                  className="w-16 h-16 flex items-center justify-center bg-secondary-500 rounded-full shadow-lg"
                >
                  <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </IonContent>
      
      {/* Use the shared component */}
      <BottomNavBar />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color="primary"
      />
    </IonPage>
  );
}