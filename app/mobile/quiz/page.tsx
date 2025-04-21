'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuizzes } from '@/core/hooks/useQuiz';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, checkmarkCircle, hourglassOutline } from 'ionicons/icons';

// Extended Quiz with status field for UI purposes
interface QuizWithStatus {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'inProgress' | 'notStarted';
}

export default function TestTypesPage() {
  useRequireAuth();
  const router = useRouter();
  const t = useTranslations('test');
  const { quizzes, fetchQuizzes, reloadQuizzes, loading, fetchError, updateError, deleteError, empty } = useQuizzes();
  const testTypes = quizzes.map(q => ({ ...q, status: 'notStarted' }));

  const handleTestSelect = (quizId: string) => {
    router.push(`/mobile/quiz/${quizId}`);
  };

  const getStatusIcon = (status: QuizWithStatus['status']) => {
    switch (status) {
      case 'completed':
        return checkmarkCircle;
      case 'inProgress':
        return hourglassOutline;
      default:
        return timeOutline;
    }
  };

  const getStatusColor = (status: QuizWithStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'inProgress':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return <LoadingScreen message={t('loading')} />;
  }

  if (fetchError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={(fetchError || updateError || deleteError)?.toString()} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('testsTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('availableTests')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {testTypes.map((quiz) => (
                <IonItem 
                  key={quiz.id} 
                  button 
                  onClick={() => handleTestSelect(quiz.id)}
                  detail={true}
                >
                  <IonIcon 
                    icon={getStatusIcon(quiz.status)} 
                    slot="start"
                    color={getStatusColor(quiz.status)}
                  />
                  <IonLabel>
                    <h2>{quiz.title}</h2>
                    <p>{quiz.description}</p>
                  </IonLabel>
                  <IonBadge slot="end" color={getStatusColor(quiz.status)}>
                    {t(`status.${quiz.status}`)}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
} 