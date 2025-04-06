'use client';

import { IonButton } from '@ionic/react';
import { useTranslations } from 'next-intl';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{t('errors.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <IonButton onClick={onRetry}>
            {t('buttons.retry')}
          </IonButton>
        )}
      </div>
    </div>
  );
} 