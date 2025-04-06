'use client';

import { useTranslations } from 'next-intl';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonRadioGroup, IonRadio, IonItem, IonLabel, IonCheckbox, IonRange } from '@ionic/react';
import type { TestQuestion } from '@/core/lib/db/types';

interface QuestionCardProps {
  question: TestQuestion;
  value?: number | number[];
  onAnswer: (value: number | number[]) => void;
}

export function QuestionCard({ question, value, onAnswer }: QuestionCardProps) {
  const t = useTranslations('test');

  const renderOptions = () => {
    switch (question.type) {
      case 'single':
        return (
          <IonRadioGroup value={value as number} onIonChange={e => onAnswer(Number(e.detail.value))}>
            {question.options?.map(option => (
              <IonItem key={option.id}>
                <IonRadio slot="start" value={option.value} />
                <IonLabel>{option.content}</IonLabel>
              </IonItem>
            ))}
          </IonRadioGroup>
        );
      case 'multiple':
        const selectedValues = (value as number[]) || [];
        return question.options?.map(option => (
          <IonItem key={option.id}>
            <IonCheckbox
              slot="start"
              checked={selectedValues.includes(option.value)}
              onIonChange={e => {
                const newValues = e.detail.checked
                  ? [...selectedValues, option.value]
                  : selectedValues.filter(v => v !== option.value);
                onAnswer(newValues);
              }}
            />
            <IonLabel>{option.content}</IonLabel>
          </IonItem>
        ));
      case 'scale':
        return (
          <IonRange
            min={1}
            max={5}
            step={1}
            value={value as number}
            onIonChange={e => onAnswer(e.detail.value as number)}
            labelPlacement="start"
          >
            <IonLabel slot="start">{t('scale.disagree')}</IonLabel>
            <IonLabel slot="end">{t('scale.agree')}</IonLabel>
          </IonRange>
        );
      default:
        return null;
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{question.content}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {renderOptions()}
      </IonCardContent>
    </IonCard>
  );
} 