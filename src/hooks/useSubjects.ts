import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Subject, SubjectFormData } from '../types';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const results = await invoke<Subject[]>('get_subjects');
      setSubjects(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (data: SubjectFormData): Promise<Subject | null> => {
    try {
      const subject = await invoke<Subject>('create_subject', { data });
      await fetchSubjects(); // Refresh list
      return subject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      console.error('Error creating subject:', err);
      return null;
    }
  };

  const updateSubject = async (id: number, data: SubjectFormData): Promise<boolean> => {
    try {
      await invoke('update_subject', { id, data });
      await fetchSubjects(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      console.error('Error updating subject:', err);
      return false;
    }
  };

  const deleteSubject = async (id: number): Promise<boolean> => {
    try {
      await invoke('delete_subject', { id });
      await fetchSubjects(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      console.error('Error deleting subject:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return {
    subjects,
    loading,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}
