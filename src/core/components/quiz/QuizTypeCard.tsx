// 统一 quiz 类型卡片组件，适用于 web/mobile
'use client';

import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/react';
import { timeOutline, helpCircleOutline } from 'ionicons/icons';
import { useTranslations } from 'next-intl';
import type { Quiz } from '@/core/services/business/quiz/types/quiz-types';

interface QuizTypeCardProps {
  quiz: Quiz;
  isSelected: boolean;
  onSelect: () => void;
}

export function QuizTypeCard({ quiz, isSelected, onSelect }: QuizTypeCardProps) {
  const t = useTranslations('test');

  return (
    <IonCard 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-primary-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <IonCardHeader>
        <IonCardTitle className="text-xl font-bold">{quiz.title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <IonIcon icon={helpCircleOutline} />
            <span>{t('questions', { count: quiz.questions?.length ?? 0 })}</span>
          </div>
          <div className="flex items-center gap-1">
            <IonIcon icon={timeOutline} />
            <span>{t('estimatedTime', { minutes: (quiz as any).estimatedMinutes ?? 5 })}</span>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
}
