// QuizQuestionStepper: 通用测评题目进度与导航组件
'use client';
import { IonButton, IonProgressBar } from '@ionic/react';

interface QuizQuestionStepperProps {
  current: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}

export function QuizQuestionStepper({ current, total, onPrev, onNext, showPrev = true, showNext = true }: QuizQuestionStepperProps) {
  return (
    <div className="flex flex-col items-center my-4">
      <div className="flex items-center gap-4 mb-2">
        {showPrev && (
          <IonButton fill="outline" size="small" onClick={onPrev} disabled={current <= 0}>上一题</IonButton>
        )}
        <span className="text-sm text-gray-500">{current + 1} / {total}</span>
        {showNext && (
          <IonButton fill="outline" size="small" onClick={onNext} disabled={current >= total - 1}>下一题</IonButton>
        )}
      </div>
      <IonProgressBar value={(current + 1) / total} className="w-full" />
    </div>
  );
}
