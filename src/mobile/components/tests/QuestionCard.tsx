'use client';

import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonRadioGroup, IonRadio, IonCheckbox, IonRange } from '@ionic/react';
import { useTranslations } from 'next-intl';
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
          <IonRadioGroup
            value={value as number}
            onIonChange={(e) => onAnswer(e.detail.value)}
          >
            <IonList>
              {question.options?.map((option) => (
                <IonItem key={option.id}>
                  <IonRadio slot="start" value={option.value} />
                  <IonLabel>{option.content}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>
        );

      case 'multiple':
        return (
          <IonList>
            {question.options?.map((option) => (
              <IonItem key={option.id}>
                <IonCheckbox
                  slot="start"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onIonChange={(e) => {
                    const newValue = Array.isArray(value) ? [...value] : [];
                    if (e.detail.checked) {
                      newValue.push(option.value);
                    } else {
                      const index = newValue.indexOf(option.value);
                      if (index > -1) {
                        newValue.splice(index, 1);
                      }
                    }
                    onAnswer(newValue);
                  }}
                />
                <IonLabel>{option.content}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        );

      case 'scale':
        return (
          <div className="px-4 py-8">
            <IonRange
              min={1}
              max={5}
              step={1}
              value={value as number}
              onIonChange={(e) => onAnswer(e.detail.value as number)}
              snaps={true}
              ticks={true}
            >
              <div slot="label" className="flex justify-between w-full px-2 text-sm text-gray-500">
                <span>{t('scale.disagree')}</span>
                <span>{t('scale.neutral')}</span>
                <span>{t('scale.agree')}</span>
              </div>
            </IonRange>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="text-lg font-medium">{question.content}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {renderOptions()}
      </IonCardContent>
    </IonCard>
  );
} 