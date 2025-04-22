// 数据注入统一入口
import { userMockData } from './mock/user.mock';
import { messageMockData } from './mock/message.mock';
import { matchMockData } from './mock/match.mock';
import { quizMockData } from './mock/quiz.mock';
import { configMockData } from './mock/config.mock';

export function getDataForEnv(env: 'mock' | 'dev' | 'prod-init') {
  if (env === 'mock') {
    return {
      user: userMockData,
      message: messageMockData,
      match: matchMockData,
      quiz: quizMockData,
      config: configMockData,
    };
  }
  // dev/prod-init 可后续扩�?  return {};
}
