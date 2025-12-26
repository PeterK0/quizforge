export interface QuizAttempt {
  id: number;
  quizId: number;
  startedAt: string;
  completedAt?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  timeTakenSeconds?: number;
}

export interface AttemptResponse {
  id: number;
  attemptId: number;
  questionId: number;
  responseData: any; // JSON - structure depends on question type
  isCorrect?: boolean;
  pointsEarned: number;
  timeSpentSeconds?: number;
}

export interface AttemptDetails extends QuizAttempt {
  responses: AttemptResponse[];
}

export interface ResponseResult {
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer?: any;
  explanation?: string;
}

export interface AttemptResult {
  attemptId: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenSeconds: number;
  passed: boolean;
}

// Analytics types
export interface TopicStats {
  topicId: number;
  topicName: string;
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  bestScore: number;
  worstScore: number;
}
