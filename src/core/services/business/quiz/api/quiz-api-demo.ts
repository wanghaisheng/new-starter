import { submitQuiz } from './quiz-api';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

// 示例：前端调用 submitQuiz 的用法
async function demoSubmitQuiz() {
  const quiz: Quiz = {
    id: 'q1',
    title: '性格测评',
    type: { id: 't1', name: '性格', scoringRule: 'sum', categoryRule: 'level' },
    questions: [
      { id: 'q1-1', quizId: 'q1', type: 'single', content: '你喜欢独处吗?', order: 1 },
      { id: 'q1-2', quizId: 'q1', type: 'single', content: '你喜欢冒险吗?', order: 2 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const quizType: QuizType = quiz.type;
  const userId = 'user123';
  const answers: QuizAnswer[] = [
    { questionId: 'q1-1', answer: '是', score: 10 },
    { questionId: 'q1-2', answer: '否', score: 5 }
  ];
  const result = await submitQuiz(quiz, quizType, userId, answers);
  console.log('AI测评结果：', result);
}

demoSubmitQuiz();
