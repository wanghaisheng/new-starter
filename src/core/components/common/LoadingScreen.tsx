'use client';

import { IonSpinner } from '@ionic/react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <IonSpinner name="crescent" />
      {message && <p className="mt-4 text-center text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );
} 