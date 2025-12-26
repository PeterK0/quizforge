import { useState, useEffect } from 'react';
import { Topic, TopicFormData } from '../../types';
import { Modal, Button, Input } from '../ui';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TopicFormData) => Promise<void>;
  topic?: Topic | null;
  subjectId: number;
}

export function TopicModal({ isOpen, onClose, onSave, topic, subjectId }: TopicModalProps) {
  const [formData, setFormData] = useState<TopicFormData>({
    subjectId,
    name: '',
    description: '',
    weekNumber: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (topic) {
      setFormData({
        subjectId: topic.subjectId,
        name: topic.name,
        description: topic.description || '',
        weekNumber: topic.weekNumber || undefined,
      });
    } else {
      setFormData({
        subjectId,
        name: '',
        description: '',
        weekNumber: undefined,
      });
    }
    setErrors({});
  }, [topic, isOpen, subjectId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Topic name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving topic:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={topic ? 'Edit Topic' : 'Create New Topic'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : topic ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Topic Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g., Introduction, Chapter 1, Unit 2"
        />

        <Input
          label="Week Number"
          type="number"
          value={formData.weekNumber || ''}
          onChange={(e) => setFormData({
            ...formData,
            weekNumber: e.target.value ? parseInt(e.target.value) : undefined
          })}
          placeholder="e.g., 1, 2, 3"
          min={1}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded border transition-colors focus:outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            rows={3}
            placeholder="Brief description of the topic"
          />
        </div>
      </form>
    </Modal>
  );
}
