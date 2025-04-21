'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuizQuestions } from '@/core/hooks/useQuiz';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function TestPage() {
  useRequireAuth();
  
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const testId = params.id as string;
  
  const { questions, fetchQuestions, reloadQuestions, loading, fetchError, updateError, deleteError, empty } = useQuizQuestions(testId);
  
  // 统一用 QuizService 获取题目和保存答题进度
  // 加载进度（本地优先，后端可选）
  const progressKey = `quiz_progress_${testId}_${currentUser?.id ?? 'guest'}`;
  const saved = typeof window !== 'undefined' ? localStorage.getItem(progressKey) : null;
  
  useEffect(() => {
    if (saved) {
      const progress = JSON.parse(saved);
      setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      setAnswers(progress.answers || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 答题并保存进度（本地优先，后端可选）
  const handleAnswer = async (answer: string) => {
    const question = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);
    // 保存本地进度
    if (typeof window !== 'undefined') {
      localStorage.setItem(progressKey, JSON.stringify({
        currentQuestionIndex: currentQuestionIndex + 1,
        answers: newAnswers
      }));
    }
    // 下一题或提交
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 提交所有答案
      try {
        // const quizService = QuizServiceFactory.create(new RemoteQuizAdapter());
        // await quizService.submitAnswers(testId, newAnswers); // 需后端支持
        // 清理本地进度
        if (typeof window !== 'undefined') {
          localStorage.removeItem(progressKey);
        }
        router.push(`/mobile/quiz/${testId}/result`);
      } catch (err) {
        setToastMessage('提交失败，请重试');
        setShowToast(true);
      }
    }
  };
  
  const currentQuestion = questions[currentQuestionIndex];
  
  if (fetchError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={(fetchError || updateError || deleteError)?.toString()} />
        </IonContent>
      </IonPage>
    );
  }
  
  if (loading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.Loading')} />
        </IonContent>
      </IonPage>
    );
  }
  
  if (!currentQuestion) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={t('auto.page.Noquest')} />
        </IonContent>
      </IonPage>
    );
  }
  
  return (
    <IonPage>
      <IonContent className="bg-[#0f172a]">
        <div className="flex flex-col h-full p-4">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round((currentQuestionIndex / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Question */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-white mb-6">
              {currentQuestion.question}
            </h2>
            
            {/* Answer options */}
            <div className="space-y-4">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    answers[currentQuestion.id] === option
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {option}
                </button>
              )) ?? (
                <div className="text-white text-center">
                  No options available for this question
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>
      
      <BottomNavBar />
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
}