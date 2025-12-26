import { useState, useEffect } from 'react';
import { Subject, SubjectFormData } from '../../types';
import { Modal, Button, Input, ColorPicker, IconPicker } from '../ui';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubjectFormData) => Promise<void>;
  subject?: Subject | null;
}

export function SubjectModal({ isOpen, onClose, onSave, subject }: SubjectModalProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'BookOpen',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        description: subject.description || '',
        color: subject.color,
        icon: subject.icon || 'BookOpen',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'BookOpen',
      });
    }
    setErrors({});
  }, [subject, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
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
      console.error('Error saving subject:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? 'Edit Subject' : 'Create New Subject'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : subject ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g., Mathematics, Physics, History"
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
            placeholder="Brief description of the subject"
          />
        </div>

        <ColorPicker
          label="Color"
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />

        <IconPicker
          label="Icon"
          value={formData.icon}
          onChange={(icon) => setFormData({ ...formData, icon })}
        />
      </form>
    </Modal>
  );
}
