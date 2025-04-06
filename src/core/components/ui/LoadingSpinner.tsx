import { IonSpinner } from '@ionic/react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <IonSpinner name="crescent" color="light" />
      <span className="ml-2 text-gray-300">{message}</span>
    </div>
  );
} 