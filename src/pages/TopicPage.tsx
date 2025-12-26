import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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

  const subject = subjects.find(s => s.id === subjectIdNum);

  const handleCreateTopic = () => {
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setIsModalOpen(true);
  };

  const handleDeleteTopic = async (topic: Topic) => {
    const success = await deleteTopic(topic.id);
    if (success) {
      console.log('Topic deleted successfully');
    }
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
        <Button onClick={handleCreateTopic}>
          <Plus size={20} className="inline mr-2" />
          New Topic
        </Button>
      }
    >
      <TopicList
        topics={topics}
        onTopicClick={handleTopicClick}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
        onQuizzesClick={handleQuizzesClick}
      />

      <TopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTopic}
        topic={editingTopic}
        subjectId={subjectIdNum}
      />
    </MainLayout>
  );
}
