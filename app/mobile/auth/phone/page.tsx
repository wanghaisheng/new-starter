'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonBackButton,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonToast
} from '@ionic/react';
import { useAuth } from '@/core/hooks/useAuth';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';

export default function PhoneSignupPage() {
  const router = useRouter();
  const { isLoading, error, sendVerificationCode, loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('');

    try {
      await sendVerificationCode(phoneNumber);
      setStep('verify');
    } catch (err) {
      console.error('Failed to send verification code:', err);
      setToastMessage('Failed to send verification code. Please try again.');
      setShowToast(true);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('');

    try {
      await loginWithPhone(phoneNumber, verificationCode);
      router.push('/mobile/home');
    } catch (err) {
      console.error('Failed to verify code:', err);
      setToastMessage('Invalid verification code. Please try again.');
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/auth/login" />
            </IonButtons>
            <IonTitle>Phone Sign In</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={step === 'phone' ? 'Sending code...' : 'Verifying code...'} />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/auth/login" />
            </IonButtons>
            <IonTitle>Phone Sign In</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/auth/login" />
          </IonButtons>
          <IonTitle>Phone Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold mb-2 text-white">
            {step === 'phone' ? 'Enter Phone Number' : 'Verify Code'}
          </h1>
          <p className="text-gray-400 mb-6">
            {step === 'phone' 
              ? 'We will send you a verification code'
              : 'Enter the code we sent to your phone'
            }
          </p>
          
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <IonItem>
                <IonLabel position="floating">Phone Number</IonLabel>
                <IonInput
                  type="tel"
                  value={phoneNumber}
                  onIonChange={e => setPhoneNumber(e.detail.value!)}
                  required
                  placeholder="+1234567890"
                />
              </IonItem>
              
              <IonButton
                expand="block"
                type="submit"
                className="mt-6"
                disabled={!phoneNumber}
              >
                Send Code
              </IonButton>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <IonItem>
                <IonLabel position="floating">Verification Code</IonLabel>
                <IonInput
                  type="text"
                  value={verificationCode}
                  onIonChange={e => setVerificationCode(e.detail.value!)}
                  required
                  placeholder="123456"
                />
              </IonItem>
              
              <IonButton
                expand="block"
                type="submit"
                className="mt-6"
                disabled={!verificationCode}
              >
                Verify Code
              </IonButton>
            </form>
          )}
        </div>
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