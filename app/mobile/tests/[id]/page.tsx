'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/mobile/components/common/GlassCard';
import { TestQuestion } from '@/core/lib/db/types';
import { useTestQuestions } from '@/core/hooks/useTest';
import { useTestProgress } from '@/core/hooks/useTest';
import { useTestNavigation } from '@/core/hooks/useTest';
import { TestService } from '@/core/services/test-service';

export default function TestDetailPage() {
  const params = useParams();
  const testTypeId = params.id as string;
  const { questions, loading: questionsLoading, error: questionsError } = useTestQuestions(testTypeId);
  const { progress, loading: progressLoading, error: progressError, updateProgress } = useTestProgress(testTypeId);
  const { navigateToResult } = useTestNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (progress) {
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      setAnswers(progress.answers);
    }
  }, [progress]);

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleNext = async () => {
    if (!selectedAnswer) return;

    const newAnswers = {
      ...answers,
      [questions[currentQuestionIndex].id]: selectedAnswer,
    };

    await updateProgress(currentQuestionIndex + 1, newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex === questions.length - 1) {
      const service = TestService.getInstance();
      const score = await service.calculateScore(testTypeId, newAnswers);
      const details = await service.generateResultDetails(testTypeId, score);
      await service.saveTestResult({
        userId: progress!.userId,
        testTypeId,
        score,
        details,
      });
      navigateToResult(testTypeId);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    }
  };

  if (questionsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (questionsError || progressError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          {questionsError?.message || progressError?.message || 'Failed to load test'}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Question {currentQuestionIndex + 1}</h2>
          <span className="text-gray-400">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <GlassCard className="mb-8">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{currentQuestion.text}</h3>
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  selectedAnswer === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handleAnswerSelect(option.id)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-between">
        <button
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          onClick={handleSkip}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Skip
        </button>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={handleNext}
          disabled={!selectedAnswer}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
} 