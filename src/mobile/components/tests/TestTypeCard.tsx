'use client';

import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/react';
import { timeOutline, helpCircleOutline } from 'ionicons/icons';
import { useTranslations } from 'next-intl';
import type { TestType } from '@/core/lib/db/types';

interface TestTypeCardProps {
  test: TestType;
  isSelected: boolean;
  onSelect: () => void;
}

export function TestTypeCard({ test, isSelected, onSelect }: TestTypeCardProps) {
  const t = useTranslations('test');

  return (
    <IonCard 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-primary-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <IonCardHeader>
        <IonCardTitle className="text-xl font-bold">{test.title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{test.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <IonIcon icon={helpCircleOutline} />
            <span>{t('questions', { count: test.questionCount })}</span>
          </div>
          <div className="flex items-center gap-1">
            <IonIcon icon={timeOutline} />
            <span>{t('estimatedTime', { minutes: test.estimatedMinutes })}</span>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
} 