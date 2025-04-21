import { IQuizAiAdapter } from '../types/quiz-service';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

type AIModelRequest = {
  model: string;
  prompt: string;
  params?: Record<string, any>;
};

type AIModelResponse = {
  result: string;
  raw?: any;
};

/**
 * 默认 AI Adapter，直接通过 fetch 调用 AI API
 */
export class DefaultAIAdapter implements IQuizAiAdapter {
  private apiBaseUrl: string;
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  async analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model: string = 'gpt-3.5',
    extraPrompt?: string
  ): Promise<AIModelResponse> {
    const prompt = this.buildPrompt(quiz, quizType, answers, extraPrompt);
    const req: AIModelRequest = { model, prompt };
    const resp = await fetch(`${this.apiBaseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!resp.ok) throw new Error('AI模型API调用失败');
    const data = await resp.json();
    return { result: data.result, raw: data };
  }
  buildPrompt(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    extraPrompt?: string
  ): string {
    let prompt = `请根据以下测评类型和用户答题内容，生成专业的分析报告和标签：\n`;
    prompt += `测评类型：${quizType.name}（${quizType.description || ''}）\n`;
    prompt += `题目与答案：\n`;
    quiz.questions.forEach((q, idx) => {
      const ans = answers.find(a => a.questionId === q.id);
      prompt += `${idx + 1}. ${q.content} 答：${ans ? JSON.stringify(ans.answer) : ''}\n`;
    });
    if (extraPrompt) prompt += `补充说明：${extraPrompt}\n`;
    return prompt;
  }
}
