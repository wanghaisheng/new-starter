import React from 'react';
import { IonButton } from '@ionic/react';

interface FormSaveButtonProps {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function FormSaveButton({ loading, onClick, children }: FormSaveButtonProps) {
  return (
    <IonButton onClick={onClick} disabled={loading} expand="block">
      {loading ? 'Saving...' : children}
    </IonButton>
  );
}
