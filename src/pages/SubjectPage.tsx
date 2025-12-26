import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Button } from '../components/ui';
import { SubjectGrid, SubjectModal } from '../components/subjects';
import { useSubjects } from '../hooks/useSubjects';
import { Subject, SubjectFormData } from '../types';
import { ask } from '@tauri-apps/plugin-dialog';

export default function SubjectPage() {
  const navigate = useNavigate();
  const { subjects, loading, createSubject, updateSubject, deleteSubject } = useSubjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const handleCreateSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    const confirmed = await ask(
      `Are you sure you want to delete "${subject.name}"? This will also delete all topics and questions associated with it.`,
      {
        title: 'Confirm Deletion',
        kind: 'warning',
      }
    );

    if (confirmed) {
      const success = await deleteSubject(subject.id);
      if (!success) {
        await ask('Failed to delete subject. Please check the console for errors.', {
          title: 'Error',
          kind: 'error',
        });
      }
    }
  };

  const handleSaveSubject = async (data: SubjectFormData) => {
    if (editingSubject) {
      await updateSubject(editingSubject.id, data);
    } else {
      await createSubject(data);
    }
  };

  const handleSubjectClick = (subject: Subject) => {
    navigate(`/subjects/${subject.id}/topics`);
  };

  if (loading) {
    return (
      <MainLayout title="Subjects">
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading subjects...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Subjects"
      breadcrumbs={[{ label: 'Home' }, { label: 'Subjects' }]}
      action={
        <Button onClick={handleCreateSubject}>
          <Plus size={20} className="inline mr-2" />
          New Subject
        </Button>
      }
    >
      <SubjectGrid
        subjects={subjects}
        onSubjectClick={handleSubjectClick}
        onEditSubject={handleEditSubject}
        onDeleteSubject={handleDeleteSubject}
      />

      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
      />
    </MainLayout>
  );
}
