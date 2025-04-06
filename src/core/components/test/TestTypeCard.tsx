'use client';

import { useTranslations } from 'next-intl';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import { TestType } from '@/core/lib/db/types/test';

interface TestTypeCardProps {
  testType: TestType;
  onSelect: () => void;
}

export function TestTypeCard({ testType, onSelect }: TestTypeCardProps) {
  const t = useTranslations('test');

  return (
    <IonCard className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
      <IonCardHeader>
        <IonCardTitle className="flex items-center justify-between">
          <span>{testType.title}</span>
          <IonIcon icon={chevronForward} />
        </IonCardTitle>
        <IonCardSubtitle>{testType.subtitle}</IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">{testType.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>{t('questions', { count: testType.questionCount })}</span>
          <span>{t('duration', { minutes: testType.estimatedMinutes })}</span>
        </div>
      </IonCardContent>
    </IonCard>
  );
} 