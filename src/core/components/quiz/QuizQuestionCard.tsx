// QuizQuestionCard: 通用测评题目卡片组件
'use client';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import type { QuizQuestion } from '@/core/services/business/quiz/types/quiz-types';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  answer?: string;
  onAnswer: (answer: string) => void;
}

export function QuizQuestionCard({ question, answer, onAnswer }: QuizQuestionCardProps) {
  return (
    <IonCard className="mb-4">
      <IonCardHeader>
        <IonCardTitle className="text-lg font-semibold">{question.title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="flex flex-col gap-2 mt-2">
          {question.options?.map((option) => (
            <button
              key={option}
              className={`rounded px-4 py-2 border text-left ${answer === option ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`}
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
}
