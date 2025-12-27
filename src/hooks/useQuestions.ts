import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Backend types (matching Rust structs with camelCase)
export interface Question {
  id: number;
  subjectId: number;
  topicId: number;
  questionType: string;
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: string;
  points: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  optionImagePath?: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuestionBlank {
  id: number;
  questionId: number;
  blankIndex: number;
  correctAnswer: string;
  acceptableAnswers?: string;
  isNumeric: boolean;
  numericTolerance?: number;
  unit?: string;
  inputType: string;
  dropdownOptions?: string;
}

export interface QuestionOrderItem {
  id: number;
  questionId: number;
  itemText: string;
  correctPosition: number;
}

export interface QuestionMatch {
  id: number;
  questionId: number;
  leftItem: string;
  rightItem: string;
  leftImagePath?: string;
  rightImagePath?: string;
  displayOrder: number;
}

export interface QuestionWithDetails {
  id: number;
  subjectId: number;
  topicId: number;
  questionType: string;
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: string;
  points: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
  blanks: QuestionBlank[];
  orderItems: QuestionOrderItem[];
  matches: QuestionMatch[];
}

export interface CreateQuestionOption {
  optionText: string;
  optionImagePath?: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface CreateQuestionBlank {
  blankIndex: number;
  correctAnswer: string;
  acceptableAnswers?: string;
  isNumeric: boolean;
  numericTolerance?: number;
  unit?: string;
  inputType: string;
  dropdownOptions?: string;
}

export interface CreateNumericData {
  correctAnswer: string;
  tolerance: string;
  unit?: string;
}

export interface CreateOrderItem {
  text: string;
  correctPosition: number;
}

export interface CreateMatchPair {
  leftItem: string;
  rightItem: string;
  leftImagePath?: string;
  rightImagePath?: string;
}

export interface CreateQuestionData {
  subjectId: number;
  topicId: number;
  questionType: string;
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: string;
  points: number;
  source?: string;
  options: CreateQuestionOption[];
  blanks: CreateQuestionBlank[];
  numericData?: CreateNumericData;
  orderItems?: CreateOrderItem[];
  matchPairs?: CreateMatchPair[];
}

export interface UpdateQuestionData {
  questionText: string;
  questionImagePath?: string;
  explanation?: string;
  difficulty: string;
  points: number;
  source?: string;
  options: CreateQuestionOption[];
  blanks: CreateQuestionBlank[];
  numericData?: CreateNumericData;
  orderItems?: CreateOrderItem[];
  matchPairs?: CreateMatchPair[];
}

export function useQuestions(topicId: number | null) {
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (topicId === null) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await invoke<QuestionWithDetails[]>('get_questions', {
        topicId,
      });
      setQuestions(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topicId]);

  const createQuestion = async (
    data: CreateQuestionData
  ): Promise<QuestionWithDetails | null> => {
    try {
      const question = await invoke<QuestionWithDetails>('create_question', {
        data,
      });
      await fetchQuestions();
      return question;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create question'
      );
      return null;
    }
  };

  const updateQuestion = async (
    id: number,
    data: UpdateQuestionData
  ): Promise<QuestionWithDetails | null> => {
    try {
      const question = await invoke<QuestionWithDetails>('update_question', {
        id,
        data,
      });
      await fetchQuestions();
      return question;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update question'
      );
      return null;
    }
  };

  const deleteQuestion = async (id: number): Promise<boolean> => {
    try {
      await invoke('delete_question', { id });
      await fetchQuestions();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete question'
      );
      return false;
    }
  };

  const getQuestion = async (id: number): Promise<QuestionWithDetails | null> => {
    try {
      const question = await invoke<QuestionWithDetails>('get_question', { id });
      return question;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question');
      return null;
    }
  };

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestion,
  };
}
