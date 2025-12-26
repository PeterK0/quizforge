import { Question } from './question';

export type ShowAnswersAfter = 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';

export interface Quiz {
  id: number;
  topicId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: ShowAnswersAfter;
  passingScorePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizFormData {
  topicId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: ShowAnswersAfter;
  passingScorePercent: number;
}

// Quiz with generated questions
export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}
