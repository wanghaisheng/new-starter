import { QuizService } from '../service/quiz-service';
import { QuizDataService } from '../data/quiz-data-service';
import { IQuizAdapter } from '../adapters/quiz-adapter';

export class QuizServiceFactory {
  static create(adapter: IQuizAdapter): QuizService {
    const dataService = new QuizDataService(adapter);
    return new QuizService(dataService);
  }
}
