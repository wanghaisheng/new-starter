'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { TestQuestion } from '@/core/lib/db/types/test';
import { useAuth } from '@/core/hooks/useAuth';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const testId = params.id as string;
  
  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);
  
  const loadTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load test questions using API
      const response = await fetch(`/api/tests/${testId}/questions`);
      if (!response.ok) {
        throw new Error('Failed to load test questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions);
      
      // Load test progress if exists
      const progressResponse = await fetch(`/api/tests/${testId}/progress`);
      if (progressResponse.ok) {
        const progress = await progressResponse.json();
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setAnswers(progress.answers);
      }
    } catch (err) {
      console.error('Error loading test:', err);
      setError(err instanceof Error ? err : new Error('Failed to load test'));
      setToastMessage('Failed to load test. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswer = async (answer: string) => {
    if (!currentUser) return;
    
    const question = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);
    
    try {
      // Save answer using API
      await fetch(`/api/tests/${testId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          answer,
        }),
      });
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Test completed, redirect to results
        router.push(`/mobile/tests/${testId}/result`);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      setToastMessage('Failed to save answer. Please try again.');
      setShowToast(true);
    }
  };
  
  const currentQuestion = questions[currentQuestionIndex];
  
  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="Loading test..." />
        </IonContent>
      </IonPage>
    );
  }
  
  if (error) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={error.toString()} onRetry={loadTest} />
        </IonContent>
      </IonPage>
    );
  }
  
  if (!currentQuestion) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error="No questions found" onRetry={loadTest} />
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