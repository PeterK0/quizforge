import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface ExamTopicWithName {
  id: number;
  examId: number;
  topicId: number;
  topicName: string;
  questionCount: number;
}

export interface Exam {
  id: number;
  subjectId: number;
  name: string;
  description?: string;
  totalQuestionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
  createdAt: string;
  updatedAt: string;
  topics: ExamTopicWithName[];
}

export interface CreateExamTopicData {
  topicId: number;
  questionCount: number;
}

export interface CreateExamData {
  subjectId: number;
  name: string;
  description?: string;
  totalQuestionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
  topics: CreateExamTopicData[];
}

export interface UpdateExamData {
  name: string;
  description?: string;
  totalQuestionCount: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
  topics: CreateExamTopicData[];
}

export function useExams(subjectId: number | null) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    if (subjectId === null) {
      setExams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await invoke<Exam[]>('get_exams', { subjectId });
      setExams(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [subjectId]);

  const createExam = async (data: CreateExamData): Promise<Exam | null> => {
    try {
      const exam = await invoke<Exam>('create_exam', { data });
      await fetchExams();
      return exam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
      return null;
    }
  };

  const updateExam = async (
    id: number,
    data: UpdateExamData
  ): Promise<Exam | null> => {
    try {
      const exam = await invoke<Exam>('update_exam', { id, data });
      await fetchExams();
      return exam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam');
      return null;
    }
  };

  const deleteExam = async (id: number): Promise<boolean> => {
    try {
      await invoke('delete_exam', { id });
      await fetchExams();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exam');
      return false;
    }
  };

  const getExam = async (id: number): Promise<Exam | null> => {
    try {
      const exam = await invoke<Exam>('get_exam', { id });
      return exam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exam');
      return null;
    }
  };

  return {
    exams,
    loading,
    error,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    getExam,
  };
}
