'use client';

import { 
  IonContent, 
  IonPage, 
  IonButton, 
  IonSpinner,
  IonIcon,
  IonText, 
  IonGrid, 
  IonRow, 
  IonCol 
} from '@ionic/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { logoGoogle } from 'ionicons/icons';

export default function OnboardingPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handlePhoneSignUp = () => {
    router.push('/mobile/auth/phone');
  };
  
  const handleGoogleSignUp = () => {
    // Implement Google sign up logic without redirect
    setIsGoogleLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsGoogleLoading(false);
      // Just show a success message instead of redirecting
      alert('Google authentication successful! This is just a demo.');
    }, 1500);
  };
  
  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <IonGrid className="h-full ion-no-padding">
          <IonRow className="h-full ion-justify-content-center ion-align-items-center">
            <IonCol className="ion-text-center" sizeMd="6" sizeSm="10" sizeXs="12">
              <div className="max-w-md mx-auto">
                <IonText color="light">
                  <h1 className="text-3xl font-bold mb-2">Connect</h1>
                </IonText>
                <IonText color="medium">
                  <p className="mb-10">
                    Find your perfect match with our advanced algorithm
                  </p>
                </IonText>
                
                <div className="mb-8 flex justify-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-secondary-500">
                    <Image 
                      src="/assets/images/avatar-placeholder.jpg" 
                      alt="Profile"
                      layout="fill"
                      objectFit="cover"
                      width={80}
                      height={80}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <IonButton 
                    expand="block" 
                    color="secondary"
                    shape="round"
                    onClick={handlePhoneSignUp}
                    className="font-medium"
                  >
                    Sign up with phone
                  </IonButton>
                  
                  <IonButton 
                    expand="block" 
                    fill="outline" 
                    color="light"
                    shape="round"
                    onClick={handleGoogleSignUp}
                    disabled={isGoogleLoading}
                    className="font-medium"
                  >
                    {isGoogleLoading ? (
                      <>
                        <IonSpinner name="dots" />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      <>
                        <IonIcon slot="start" icon={logoGoogle} />
                        Continue with Google
                      </>
                    )}
                  </IonButton>
                </div>
                
                <div className="mt-8">
                  <IonText color="medium">
                    Already have an account? 
                  </IonText>
                  <Link href="/mobile/auth/login" className="text-secondary-400 font-medium ml-1">
                    Log in
                  </Link>
                </div>
                
                <div className="mt-8">
                  <Link href="/mobile/home" className="text-secondary-400 underline">
                    Skip to home page
                  </Link>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
}