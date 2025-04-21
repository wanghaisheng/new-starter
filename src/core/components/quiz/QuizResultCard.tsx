// QuizResultCard: 通用测评结果卡片组件
'use client';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel } from '@ionic/react';
import type { QuizResult } from '@/core/services/business/quiz/types/quiz-types';

interface QuizResultCardProps {
  result: QuizResult;
}

export function QuizResultCard({ result }: QuizResultCardProps) {
  return (
    <IonCard className="my-4">
      <IonCardHeader>
        <IonCardTitle className="text-lg font-bold">{result.quiz?.title ?? '测评结果'}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="mb-2">得分：{result.score}</div>
        <IonList>
          {result.report?.traits?.map((trait, idx) => (
            <IonItem key={idx}>
              <IonLabel>{trait.name}: {trait.score}%</IonLabel>
            </IonItem>
          ))}
        </IonList>
        {result.report?.suggestion && (
          <div className="mt-2 text-sm text-gray-500">建议：{result.report.suggestion}</div>
        )}
      </IonCardContent>
    </IonCard>
  );
}
