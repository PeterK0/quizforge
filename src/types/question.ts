export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'FILL_BLANK_MULTIPLE'
  | 'NUMERIC_INPUT'
  | 'MATCHING'
  | 'ORDERING'
  | 'IMAGE_IDENTIFICATION'
  | 'CALCULATION';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Base question interface
export interface BaseQuestion {
  id: number;
  subjectId: number;
  topicId: number;
  questionType: QuestionType;
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: Difficulty;
  points: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// Question Option (for choice-based questions)
export interface QuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  optionImagePath?: string;
  isCorrect: boolean;
  displayOrder: number;
}

// Fill Blank
export interface QuestionBlank {
  id: number;
  questionId: number;
  blankIndex: number;
  correctAnswer: string;
  acceptableAnswers?: string[];
  isNumeric: boolean;
  numericTolerance?: number;
  unit?: string;
}

// Matching
export interface QuestionMatch {
  id: number;
  questionId: number;
  leftItem: string;
  rightItem: string;
  displayOrder: number;
}

// Ordering
export interface QuestionOrderItem {
  id: number;
  questionId: number;
  itemText: string;
  correctPosition: number;
}

// Specific question type interfaces
export interface SingleChoiceQuestion extends BaseQuestion {
  questionType: 'SINGLE_CHOICE';
  options: QuestionOption[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  questionType: 'MULTIPLE_CHOICE';
  options: QuestionOption[];
  minSelections?: number;
  maxSelections?: number;
}

export interface FillBlankQuestion extends BaseQuestion {
  questionType: 'FILL_BLANK';
  blanks: QuestionBlank[];
}

export interface FillBlankMultipleQuestion extends BaseQuestion {
  questionType: 'FILL_BLANK_MULTIPLE';
  blanks: Array<{
    index: number;
    options: string[];
    correctAnswer: string;
  }>;
}

export interface NumericInputQuestion extends BaseQuestion {
  questionType: 'NUMERIC_INPUT';
  correctAnswer: number;
  tolerance: number;
  toleranceType: 'ABSOLUTE' | 'PERCENTAGE';
  decimalPlaces?: number;
  unit?: string;
  formula?: string;
}

export interface MatchingQuestion extends BaseQuestion {
  questionType: 'MATCHING';
  matches: QuestionMatch[];
  allowReuseRight: boolean;
}

export interface OrderingQuestion extends BaseQuestion {
  questionType: 'ORDERING';
  items: QuestionOrderItem[];
  orderDirection: 'ASCENDING' | 'DESCENDING' | 'CUSTOM';
}

export interface ImageIdentificationQuestion extends BaseQuestion {
  questionType: 'IMAGE_IDENTIFICATION';
  imagePath: string;
  imageAltText?: string;
  options: QuestionOption[];
}

export interface CalculationQuestion extends BaseQuestion {
  questionType: 'CALCULATION';
  variables: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
  answers: Array<{
    label: string;
    correctValue: number;
    tolerance: number;
    unit: string;
  }>;
  solutionSteps?: string[];
}

// Union type for all question types
export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | FillBlankMultipleQuestion
  | NumericInputQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ImageIdentificationQuestion
  | CalculationQuestion;

// Question filters
export interface QuestionFilters {
  topicId?: number;
  questionType?: QuestionType;
  difficulty?: Difficulty;
  source?: string;
  searchText?: string;
}

// Question form data
export interface QuestionFormData {
  subjectId: number;
  topicId: number;
  questionType: QuestionType;
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: Difficulty;
  points: number;
  source?: string;
}
