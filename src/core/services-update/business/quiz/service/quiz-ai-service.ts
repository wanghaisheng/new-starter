import { Quiz, QuizType, QuizQuestion, QuizAnswer, QuizResult } from '@/core/lib/db/types/quiz';

export interface AIModelRequest {
  model: string; // chatglm, gpt-3.5, etc.
  prompt: string;
  params?: Record<string, any>;
}

export interface AIModelResponse {
  result: string;
  raw?: any;
}

/**
 * QuizAIService：负责将用户输入、quiz数据等调用AI模型API获得分析/标签/报告
 */
export class QuizAIService {
  private apiBaseUrl: string;
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * 调用指定AI模型分析quiz答案，返回AI生成的结果
   */
  async analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model: string = 'gpt-3.5',
    extraPrompt?: string
  ): Promise<AIModelResponse> {
    // 构造prompt，可根据quizType/answers自定义
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

  /**
   * 构造AI模型的prompt
   */
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
    if (extraPrompt) prompt += `\n补充提示：${extraPrompt}\n`;
    prompt += `\n请输出结构化JSON，包含标签数组tags和详细分析report。`;
    return prompt;
  }

  /**
   * 调用AI并自动落库QuizResult，同时联动match服务
   */
  async analyzeAndSaveQuizResult(
    quiz: Quiz,
    quizType: QuizType,
    userId: string,
    answers: QuizAnswer[],
    saveQuizResult: (result: QuizResult) => Promise<QuizResult>,
    matchService: { onQuizResult: (userId: string, tags: string[], report: any) => Promise<void> },
    model: string = 'gpt-3.5',
    extraPrompt?: string
  ): Promise<QuizResult> {
    const aiResp = await this.analyzeQuizWithAI(quiz, quizType, answers, model, extraPrompt);
    let aiJson: { tags: string[]; report: any };
    try {
      aiJson = typeof aiResp.result === 'string' ? JSON.parse(aiResp.result) : aiResp.result;
    } catch {
      throw new Error('AI返回结果非JSON格式');
    }
    const quizResult: QuizResult = {
      id: `${userId}_${quiz.id}_${Date.now()}`,
      userId,
      quizId: quiz.id,
      answers,
      tags: aiJson.tags,
      report: aiJson.report,
      score: typeof aiJson.report?.score === 'number' ? aiJson.report.score : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // 落库
    await saveQuizResult(quizResult);
    // 联动match服务
    await matchService.onQuizResult(userId, quizResult.tags, quizResult.report);
    return quizResult;
  }
}
