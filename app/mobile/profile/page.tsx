'use client';

import { useState } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonChip,
  IonAvatar,
  IonBadge,
  IonItemDivider,
  IonRippleEffect,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { 
  camera, 
  settings, 
  pencil,
  chatbubbleEllipsesOutline,
  heart,
  location,
  calendarOutline,
  schoolOutline,
  briefcaseOutline,
  peopleOutline,
  wineOutline,
  planetOutline
} from 'ionicons/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => router.push('/mobile/settings')}>
              <IonIcon icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Cover photo with edit button */}
        <div className="relative w-full h-48 bg-gradient-to-r from-purple-500 to-pink-500">
          <IonFab vertical="bottom" horizontal="end" slot="fixed" edge={true}>
            <IonFabButton size="small">
              <IonIcon icon={camera} />
            </IonFabButton>
          </IonFab>
        </div>
        
        {/* Profile card with avatar */}
        <div className="ion-padding relative">
          {/* Avatar - positioned to overlap with cover photo */}
          <div className="absolute -top-16 left-4">
            <IonAvatar style={{ width: '80px', height: '80px', border: '4px solid white' }}>
              <Image 
                src="/assets/images/avatar-placeholder.jpg" 
                alt="Profile" 
                width={80} 
                height={80} 
                className="object-cover"
              />
            </IonAvatar>
          </div>
          
          {/* Name and basic info - with padding to account for avatar */}
          <div className="pt-16">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Jessica Parker</h1>
                <div className="flex items-center text-gray-500 text-sm">
                  <IonIcon icon={location} className="mr-1" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
              
              <IonButton size="small" fill="outline" onClick={handleEditProfile}>
                <IonIcon icon={pencil} slot="start" />
                Edit
              </IonButton>
            </div>
            
            {/* Action buttons */}
            <div className="flex mt-4 space-x-2">
              <IonButton expand="block" size="small" color="primary">
                <IonIcon icon={chatbubbleEllipsesOutline} slot="start" />
                Message
              </IonButton>
              <IonButton expand="block" size="small" color="secondary">
                <IonIcon icon={heart} slot="start" />
                Like
              </IonButton>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">248</div>
                <div className="text-xs text-gray-500">Matches</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">36</div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">142</div>
                <div className="text-xs text-gray-500">Visits</div>
              </div>
            </div>
          </div>
          
          {/* Tab buttons */}
          <div className="flex border-b mb-4">
            <button 
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'about' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'photos' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('photos')}
            >
              Photos
            </button>
            <button 
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'interests' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('interests')}
            >
              Interests
            </button>
          </div>
          
          {/* Tab content */}
          {activeTab === 'about' && (
            <IonList lines="full">
              <IonItem>
                <IonIcon icon={calendarOutline} slot="start" color="medium" />
                <IonLabel>
                  <h3>Age</h3>
                  <p>28 years</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={schoolOutline} slot="start" color="medium" />
                <IonLabel>
                  <h3>Education</h3>
                  <p>Stanford University</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={briefcaseOutline} slot="start" color="medium" />
                <IonLabel>
                  <h3>Occupation</h3>
                  <p>UX Designer at Google</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={peopleOutline} slot="start" color="medium" />
                <IonLabel>
                  <h3>Looking for</h3>
                  <p>Meaningful relationship</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={planetOutline} slot="start" color="medium" />
                <IonLabel>
                  <h3>Languages</h3>
                  <p>English, Spanish</p>
                </IonLabel>
              </IonItem>
            </IonList>
          )}
          
          {activeTab === 'photos' && (
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square relative overflow-hidden">
                  <Image 
                    src={`/assets/images/avatar-placeholder.jpg`} 
                    alt={`Photo ${i}`} 
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'interests' && (
            <div className="flex flex-wrap gap-2">
              <IonChip color="primary">
                <IonLabel>Travel</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Photography</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Hiking</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Reading</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Cooking</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Movies</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Music</IonLabel>
              </IonChip>
              <IonChip color="primary">
                <IonLabel>Art</IonLabel>
              </IonChip>
            </div>
          )}
        </div>
      </IonContent>
      
      <BottomNavBar />
    </IonPage>
  );
} 