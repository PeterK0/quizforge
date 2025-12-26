import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Topic, TopicFormData } from '../types';

export function useTopics(subjectId?: number) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = async () => {
    if (subjectId === undefined) {
      setTopics([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await invoke<Topic[]>('get_topics', { subjectId });
      setTopics(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async (data: TopicFormData): Promise<Topic | null> => {
    try {
      const topic = await invoke<Topic>('create_topic', { data });
      await fetchTopics(); // Refresh list
      return topic;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
      console.error('Error creating topic:', err);
      return null;
    }
  };

  const updateTopic = async (id: number, data: Omit<TopicFormData, 'subjectId'>): Promise<boolean> => {
    try {
      await invoke('update_topic', { id, data });
      await fetchTopics(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic');
      console.error('Error updating topic:', err);
      return false;
    }
  };

  const deleteTopic = async (id: number): Promise<boolean> => {
    try {
      await invoke('delete_topic', { id });
      await fetchTopics(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic');
      console.error('Error deleting topic:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [subjectId]);

  return {
    topics,
    loading,
    error,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
