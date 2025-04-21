'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import Image from 'next/image';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function ProfilePhotoSetupPage() {
  useRequireAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPhoto = (index: number) => {
    // In a real app, this would open a file picker or camera
    // For this demo, we'll just add a placeholder
    const newPhotos = [...photos];
    newPhotos[index] = `/assets/images/photo-placeholder-${index + 1}.jpg`;
    setPhotos(newPhotos);
  };

  const handleSubmit = async () => {
    if (photos.length < 2) {
      alert('Please add at least 2 photos to continue');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to save photos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to the next step in profile setup
      router.push('/mobile/profile/setup/details');
    } catch (error) {
      console.error('Failed to save photos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/mobile/profile/setup/details');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/auth/phone" />
          </IonButtons>
          <IonTitle{t('auto.page.AddPhot')}/IonTitle>
          <IonButtons slot="end">
            <button 
              onClick={handleSkip}
              className="px-3 py-1 text-primary-500 font-medium"
            >
              Skip
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <div className="max-w-md mx-auto">
                <h1 className="text-xl font-bold mb-2"{t('auto.page.Showyou')}/h1>
                <p className="text-gray-600 mb-6"{t('auto.page.Addatl')}/p>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* First photo (main photo) is larger */}
                  <div className="col-span-2">
                    {photos[0] ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image 
                          src={photos[0]} 
                          alt={t('auto.page.Profile')} 
                          fill 
                          className="object-cover"
                        />
                        <button 
                          onClick={() => handleAddPhoto(0)}
                          className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAddPhoto(0)}
                        className="w-full aspect-square flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500"{t('auto.page.Addphot')}/span>
                      </button>
                    )}
                  </div>
                  
                  {/* Additional photo slots */}
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="col-span-1">
                      {photos[index] ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden">
                          <Image 
                            src={photos[index]} 
                            alt={`Photo ${index + 1}`} 
                            fill 
                            className="object-cover"
                          />
                          <button 
                            onClick={() => handleAddPhoto(index)}
                            className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAddPhoto(index)}
                          className="w-full aspect-square flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    className={`w-full bg-primary-500 text-white py-3 px-4 rounded-full font-medium transition-colors hover:bg-primary-600 ${
                      isLoading || photos.length < 2 ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading || photos.length < 2}
                  >
                    {isLoading ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
} 