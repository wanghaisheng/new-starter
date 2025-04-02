'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';

export default function PhoneSignupPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call to send verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to verification step
      setStep('verification');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to profile setup on success
      router.push('/mobile/profile/setup');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
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
          <IonTitle>{step === 'phone' ? 'Phone Number' : 'Verification'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <div className="max-w-md mx-auto">
                {step === 'phone' ? (
                  <>
                    <h1 className="text-2xl font-bold mb-2">Enter your phone number</h1>
                    <p className="text-gray-600 mb-6">We'll send you a verification code</p>
                    
                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                        {error}
                      </div>
                    )}
                    
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className={`w-full bg-primary-500 text-white py-3 px-4 rounded-full font-medium transition-colors hover:bg-primary-600 ${
                          isLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                        disabled={isLoading || !phoneNumber}
                      >
                        {isLoading ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-2">Verify your phone</h1>
                    <p className="text-gray-600 mb-6">
                      We've sent a code to {phoneNumber}
                    </p>
                    
                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                        {error}
                      </div>
                    )}
                    
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Code
                        </label>
                        <input
                          id="code"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md text-center text-xl tracking-widest"
                          placeholder="Enter code"
                          maxLength={6}
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className={`w-full bg-primary-500 text-white py-3 px-4 rounded-full font-medium transition-colors hover:bg-primary-600 ${
                          isLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                        disabled={isLoading || verificationCode.length < 4}
                      >
                        {isLoading ? 'Verifying...' : 'Verify and Continue'}
                      </button>
                      
                      <div className="text-center mt-4">
                        <button 
                          type="button" 
                          onClick={() => {
                            setVerificationCode('');
                            setError('');
                            setStep('phone');
                          }}
                          className="text-primary-500"
                        >
                          Change phone number
                        </button>
                      </div>
                      
                      <div className="text-center">
                        <button 
                          type="button" 
                          onClick={() => {
                            setVerificationCode('');
                            setError('');
                            handleSendCode(new Event('submit') as any);
                          }}
                          className="text-primary-500"
                          disabled={isLoading}
                        >
                          Resend code
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
} 