'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonProgressBar } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { TestService } from '@/core/services/test-service';
import type { TestQuestion, TestProgress, TestAnswer } from '@/core/lib/db/types';
import { LoadingScreen } from '@/core/components/common/LoadingScreen';
import { ErrorScreen } from '@/core/components/common/ErrorScreen';
import { QuestionCard } from '@/core/components/tests/QuestionCard';

export default function TestPage() {
  const params = useParams();
  const t = useTranslations('test');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});

  useEffect(() => {
    async function loadTest() {
      try {
        const service = TestService.getInstance();
        const testId = params.id as string;
        const [loadedQuestions, savedProgress] = await Promise.all([
          service.getTestQuestions(testId),
          service.getTestProgress('current-user', testId) // TODO: Replace with actual user ID
        ]);
        
        setQuestions(loadedQuestions);
        if (savedProgress) {
          setTestProgress(savedProgress);
          setCurrentIndex(savedProgress.currentQuestionIndex);
          setAnswers(savedProgress.answers);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(t('errors.loadFailed')));
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [params.id, t]);

  const handleAnswer = async (value: number | number[]) => {
    const currentQuestion = questions[currentIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    try {
      const service = TestService.getInstance();
      const testId = params.id as string;
      
      await service.saveTestProgress({
        id: testProgress?.id,
        userId: 'current-user', // TODO: Replace with actual user ID
        testId,
        currentQuestionIndex: currentIndex,
        answers: newAnswers,
        startedAt: testProgress?.startedAt || new Date()
      });

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const score = await service.calculateScore(questions, newAnswers);
        const testAnswers: TestAnswer[] = Object.entries(newAnswers).map(([questionId, value]) => ({
          questionId,
          value,
          timestamp: new Date().toISOString()
        }));

        await service.saveTestResult({
          userId: 'current-user', // TODO: Replace with actual user ID
          testId,
          score,
          answers: testAnswers,
          traits: [], // TODO: Generate traits from score
          completedAt: new Date().toISOString()
        });
        // TODO: Navigate to results page
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('errors.saveFailed')));
    }
  };

  if (loading) {
    return <LoadingScreen message={t('loading')} />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={() => window.location.reload()} />;
  }

  const currentQuestion = questions[currentIndex];
  const progressValue = (currentIndex + 1) / questions.length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => window.history.back()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('question', { current: currentIndex + 1, total: questions.length })}</IonTitle>
        </IonToolbar>
        <IonProgressBar value={progressValue} />
      </IonHeader>
      <IonContent className="ion-padding">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />
        )}
      </IonContent>
    </IonPage>
  );
} 