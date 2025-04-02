'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IonContent, IonPage } from '@ionic/react';
import Image from 'next/image';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

// Mock data for user profiles
const mockProfiles = [
  {
    id: '1',
    name: 'Sarah',
    age: 28,
    distance: 5,
    bio: 'Dog lover. Coffee addict. Adventure seeker.',
    images: ['/assets/images/profile-sarah.jpg'],
  },
  {
    id: '2',
    name: 'Jessica',
    age: 26,
    distance: 3,
    bio: 'Traveling the world one country at a time.',
    images: ['/assets/images/profile-jessica.jpg'],
  },
  {
    id: '3',
    name: 'Emma',
    age: 24,
    distance: 8,
    bio: 'Foodie, photographer, and hiking enthusiast.',
    images: ['/assets/images/profile-emma.jpg'],
  },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const currentProfile = mockProfiles[currentProfileIndex];

  const handleLike = () => {
    // 50% chance of a match for demo purposes
    const isMatch = Math.random() > 0.5;
    
    if (isMatch) {
      setMatchedProfile(currentProfile);
      setShowMatch(true);
    } else {
      goToNextProfile();
    }
  };

  const handleDislike = () => {
    goToNextProfile();
  };

  const goToNextProfile = () => {
    setSwipeDirection(null);
    if (currentProfileIndex < mockProfiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      // Start over when we reach the end
      setCurrentProfileIndex(0);
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

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {showMatch ? (
          // Match screen
          <div className="fixed inset-0 bg-opacity-90 bg-gray-900 z-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm mx-auto">
              <h1 className="text-3xl font-bold text-pink-500 mb-4">It's a Match!</h1>
              <p className="text-white mb-6">You and {matchedProfile.name} have liked each other</p>
              
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
                      src={matchedProfile.images[0]}
                      alt={matchedProfile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleSendMessage}
                  className="w-full bg-pink-500 text-white py-3 px-4 rounded-md font-medium"
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
          <div className="flex flex-col h-full pb-20">
            {/* Profile card */}
            <div 
              ref={cardRef}
              className="flex-1 relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="absolute inset-0">
                <Image
                  src={currentProfile.images[0] || '/assets/images/profile-placeholder.jpg'}
                  alt={currentProfile.name}
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
                <h2 className="text-3xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
                <p className="text-sm">{currentProfile.distance} miles away</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-center py-6 space-x-4">
              <button 
                onClick={handleDislike}
                className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                onClick={handleLike}
                className="w-14 h-14 flex items-center justify-center bg-pink-500 rounded-full shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </IonContent>
      
      {/* Use shared BottomNavBar component */}
      <BottomNavBar />
    </IonPage>
  );
}