import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Quiz {
  id: number;
  topicId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizData {
  topicId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
}

export interface UpdateQuizData {
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
}

export function useQuizzes(topicId: number | null) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    if (topicId === null) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await invoke<Quiz[]>('get_quizzes', { topicId });
      setQuizzes(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [topicId]);

  const createQuiz = async (data: CreateQuizData): Promise<Quiz | null> => {
    try {
      const quiz = await invoke<Quiz>('create_quiz', { data });
      await fetchQuizzes();
      return quiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
      return null;
    }
  };

  const updateQuiz = async (
    id: number,
    data: UpdateQuizData
  ): Promise<Quiz | null> => {
    try {
      const quiz = await invoke<Quiz>('update_quiz', { id, data });
      await fetchQuizzes();
      return quiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
      return null;
    }
  };

  const deleteQuiz = async (id: number): Promise<boolean> => {
    try {
      await invoke('delete_quiz', { id });
      await fetchQuizzes();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
      return false;
    }
  };

  const getQuiz = async (id: number): Promise<Quiz | null> => {
    try {
      const quiz = await invoke<Quiz>('get_quiz', { id });
      return quiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quiz');
      return null;
    }
  };

  return {
    quizzes,
    loading,
    error,
    fetchQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getQuiz,
  };
}
