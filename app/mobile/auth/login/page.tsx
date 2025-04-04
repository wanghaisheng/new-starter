'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonBackButton, 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonList,
  IonCard,
  IonCardContent,
  IonNote,
  IonLoading,
  IonAlert
} from '@ionic/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Implement actual login logic here
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to home on success
      router.push('/mobile/home');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile" />
          </IonButtons>
          <IonTitle>Log In</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
            
            {error && (
              <IonText color="danger" className="mb-4 block">
                <p>{error}</p>
              </IonText>
            )}
            
            <form onSubmit={handleLogin}>
              <IonList className="ion-no-padding">
                <IonItem>
                  <IonLabel position="floating">Email or Phone</IonLabel>
                  <IonInput
                    type="text"
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value!)}
                    required
                    clearInput
                  />
                </IonItem>
                
                <IonItem className="ion-margin-bottom">
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonChange={(e) => setPassword(e.detail.value!)}
                    required
                    clearInput
                  />
                  <IonNote slot="helper">
                    <Link href="/mobile/auth/forgot-password" className="text-primary-500">
                      Forgot password?
                    </Link>
                  </IonNote>
                </IonItem>
              
                <div className="ion-margin-top">
                  <IonButton 
                    type="submit" 
                    expand="block"
                    shape="round"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </IonButton>
                </div>
              </IonList>
            </form>
            
            <div className="mt-6 ion-text-center">
              <IonText color="medium">
                Don't have an account?{' '}
                <Link href="/mobile" className="text-primary-500 font-medium">
                  Sign up
                </Link>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
      
      <IonLoading
        isOpen={isLoading}
        message="Logging in..."
      />
      
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Login Failed"
        message={error}
        buttons={['OK']}
      />
    </IonPage>
  );
} 