import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Button } from '../components/ui';
import { TopicList, TopicModal } from '../components/topics';
import { useTopics } from '../hooks/useTopics';
import { useSubjects } from '../hooks/useSubjects';
import { Topic, TopicFormData } from '../types';

export default function TopicPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const subjectIdNum = parseInt(subjectId || '0');

  const { subjects } = useSubjects();
  const { topics, loading, createTopic, updateTopic, deleteTopic } = useTopics(subjectIdNum);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  const subject = subjects.find(s => s.id === subjectIdNum);

  const handleCreateTopic = () => {
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setIsModalOpen(true);
  };

  const handleDeleteTopicClick = (topic: Topic) => {
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;

    const success = await deleteTopic(topicToDelete.id);
    if (success) {
      console.log('Topic deleted successfully');
    }
    setShowDeleteConfirm(false);
    setTopicToDelete(null);
  };

  const handleSaveTopic = async (data: TopicFormData) => {
    if (editingTopic) {
      await updateTopic(editingTopic.id, data);
    } else {
      await createTopic(data);
    }
  };

  const handleTopicClick = (topic: Topic) => {
    navigate(`/subjects/${subjectId}/topics/${topic.id}/questions`);
  };

  const handleQuizzesClick = (topic: Topic) => {
    navigate(`/subjects/${subjectId}/topics/${topic.id}/quizzes`);
  };

  const handleExamsClick = () => {
    navigate(`/subjects/${subjectId}/exams`);
  };

  if (loading) {
    return (
      <MainLayout title="Topics">
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading topics...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={subject?.name || 'Topics'}
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Subjects' },
        { label: subject?.name || 'Topics' },
      ]}
      showBack={true}
      action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExamsClick}>
            <FileText size={20} className="inline mr-2" />
            Exams
          </Button>
          <Button onClick={handleCreateTopic}>
            <Plus size={20} className="inline mr-2" />
            New Topic
          </Button>
        </div>
      }
    >
      <TopicList
        topics={topics}
        onTopicClick={handleTopicClick}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopicClick}
        onQuizzesClick={handleQuizzesClick}
      />

      <TopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTopic}
        topic={editingTopic}
        subjectId={subjectIdNum}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && topicToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-bg-primary rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Delete Topic</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{topicToDelete.name}"? This will also delete all questions, quizzes, and data associated with this topic. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTopicToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTopic}
                style={{
                  backgroundColor: 'var(--color-accent-red)',
                  borderColor: 'var(--color-accent-red)',
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
