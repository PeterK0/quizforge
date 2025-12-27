import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { QuizCard } from '../components/quizzes/QuizCard';
import { QuizModal } from '../components/quizzes/QuizModal';
import {
  useQuizzes,
  Quiz,
  CreateQuizData,
  UpdateQuizData,
} from '../hooks/useQuizzes';
import { invoke } from '@tauri-apps/api/core';

interface Topic {
  id: number;
  subjectId: number;
  name: string;
  description?: string;
}

interface Subject {
  id: number;
  name: string;
}

export default function QuizManagementPage() {
  const { subjectId, topicId } = useParams<{
    subjectId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const topicIdNum = topicId ? parseInt(topicId) : null;
  const subjectIdNum = subjectId ? parseInt(subjectId) : 0;

  const { quizzes, loading, error, createQuiz, updateQuiz, deleteQuiz } =
    useQuizzes(topicIdNum);

  useEffect(() => {
    if (topicIdNum) {
      loadTopic(topicIdNum);
      loadQuestionCount(topicIdNum);
    }
  }, [topicIdNum]);

  useEffect(() => {
    if (subjectIdNum) {
      loadSubject(subjectIdNum);
    }
  }, [subjectIdNum]);

  const loadTopic = async (id: number) => {
    try {
      const result = await invoke<Topic>('get_topic', { id });
      setTopic(result);
    } catch (err) {
      console.error('Failed to load topic:', err);
    }
  };

  const loadSubject = async (id: number) => {
    try {
      const result = await invoke<Subject>('get_subject', { id });
      setSubject(result);
    } catch (err) {
      console.error('Failed to load subject:', err);
    }
  };

  const loadQuestionCount = async (topicId: number) => {
    try {
      const questions = await invoke<any[]>('get_questions', { topicId });
      setQuestionCount(questions.length);
    } catch (err) {
      console.error('Failed to load question count:', err);
      setQuestionCount(0);
    }
  };

  const handleCreateQuiz = async (data: CreateQuizData) => {
    const result = await createQuiz(data);
    if (result) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateQuiz = async (data: CreateQuizData) => {
    if (!editingQuiz) return;

    const updateData: UpdateQuizData = {
      name: data.name,
      description: data.description,
      questionCount: data.questionCount,
      timeLimitMinutes: data.timeLimitMinutes,
      shuffleQuestions: data.shuffleQuestions,
      shuffleOptions: data.shuffleOptions,
      showAnswersAfter: data.showAnswersAfter,
      passingScorePercent: data.passingScorePercent,
    };

    const result = await updateQuiz(editingQuiz.id, updateData);
    if (result) {
      setIsModalOpen(false);
      setEditingQuiz(null);
    }
  };

  const handleEditClick = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleDeleteQuizClick = (id: number) => {
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return;

    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    await deleteQuiz(quizToDelete.id);
    setShowDeleteConfirm(false);
    setQuizToDelete(null);
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    navigate(`/subjects/${subjectId}/topics/${topicId}/quizzes/${quiz.id}/take`);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingQuiz(null);
  };

  const breadcrumbs = [
    { label: 'Subjects', href: '/' },
    {
      label: subject?.name || 'Subject',
      href: `/subjects/${subjectId}/topics`,
    },
    {
      label: topic?.name || 'Topic',
      href: `/subjects/${subjectId}/topics`,
    },
    { label: 'Quizzes' },
  ];

  if (!topicIdNum) {
    return (
      <MainLayout title="Quiz Management" breadcrumbs={breadcrumbs}>
        <div className="text-center text-text-secondary py-12">
          Invalid topic ID
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <MainLayout
        title={`Quizzes: ${topic?.name || 'Loading...'}`}
        breadcrumbs={breadcrumbs}
        showBack={true}
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={questionCount === 0}
            className="min-w-[160px] h-[40px] flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" />
            Create Quiz
          </Button>
        }
      >
        {questionCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">
              No questions available in this topic. Add questions before creating
              quizzes.
            </p>
            <Button
              onClick={() =>
                navigate(
                  `/subjects/${subjectId}/topics/${topicId}/questions`
                )
              }
            >
              Go to Questions
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center text-text-secondary py-12">
            Loading quizzes...
          </div>
        ) : error ? (
          <div className="text-center text-accent-red py-12">Error: {error}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">
              No quizzes yet. Create your first quiz to get started!
            </p>
            <p className="text-sm text-text-secondary mb-4">
              {questionCount} questions available
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="min-w-[190px] h-[40px] flex items-center justify-center">
              <Plus size={20} className="mr-2" />
              Create First Quiz
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-text-secondary">
              {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} | {questionCount}{' '}
              questions available
            </div>
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteQuizClick}
                  onTake={handleTakeQuiz}
                />
              ))}
            </div>
          </>
        )}
      </MainLayout>

      {/* Quiz Modal */}
      {isModalOpen && (
        <QuizModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
          quiz={editingQuiz}
          topicId={topicIdNum}
          availableQuestionCount={questionCount}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && quizToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-bg-primary rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Delete Quiz</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{quizToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQuizToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteQuiz}
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
    </>
  );
}
