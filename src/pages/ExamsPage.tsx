import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Play, Edit2, Trash2, BookOpen } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { ExamModal } from '../components/exams/ExamModal';
import { useExams, Exam, CreateExamData, UpdateExamData } from '../hooks/useExams';
import { invoke } from '@tauri-apps/api/core';

interface Subject {
  id: number;
  name: string;
  description?: string;
}

interface Topic {
  id: number;
  subjectId: number;
  name: string;
}

export default function ExamsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const subjectIdNum = subjectId ? parseInt(subjectId) : null;

  const { exams, loading, error, createExam, updateExam, deleteExam } = useExams(subjectIdNum);

  useEffect(() => {
    if (subjectIdNum) {
      loadSubject(subjectIdNum);
      loadTopics(subjectIdNum);
    }
  }, [subjectIdNum]);

  const loadSubject = async (id: number) => {
    try {
      const result = await invoke<Subject>('get_subject', { id });
      setSubject(result);
    } catch (err) {
      console.error('Failed to load subject:', err);
    }
  };

  const loadTopics = async (subjectId: number) => {
    try {
      const result = await invoke<Topic[]>('get_topics', { subjectId });
      setTopics(result);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  const handleCreateExam = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleDeleteExamClick = (id: number) => {
    const exam = exams.find(e => e.id === id);
    if (!exam) return;

    setExamToDelete(exam);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;

    await deleteExam(examToDelete.id);
    setShowDeleteConfirm(false);
    setExamToDelete(null);
  };

  const handleTakeExam = (examId: number) => {
    navigate(`/subjects/${subjectId}/exams/${examId}/take`);
  };

  const handleSubmitExam = async (data: CreateExamData | UpdateExamData) => {
    if (editingExam) {
      await updateExam(editingExam.id, data as UpdateExamData);
    } else {
      await createExam(data as CreateExamData);
    }
  };

  if (!subject) {
    return (
      <MainLayout title="Loading...">
        <div className="text-center text-text-secondary py-12">
          Loading subject...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${subject.name} - Exams`}
      breadcrumbs={[
        { label: 'Subjects', onClick: () => navigate('/subjects') },
        { label: subject.name, onClick: () => navigate(`/subjects/${subjectId}/topics`) },
        { label: 'Exams' },
      ]}
      showBack={true}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-text-secondary">
            Create exams that pull questions from multiple topics
          </p>
        </div>
        <Button onClick={handleCreateExam} className="min-w-[160px] h-[40px] flex items-center justify-center">
          <Plus size={20} className="mr-2" />
          Create Exam
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-accent-red/10 border border-accent-red rounded-lg">
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-text-secondary py-12">
          Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen
            size={64}
            className="mx-auto mb-4 opacity-20"
            style={{ color: 'var(--color-text-secondary)' }}
          />
          <p className="text-text-secondary mb-4">
            No exams yet. Create your first exam!
          </p>
          <Button onClick={handleCreateExam} className="min-w-[160px] h-[40px] flex items-center justify-center">
            <Plus size={20} className="mr-2" />
            Create Exam
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-accent-blue transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {exam.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
                      {exam.totalQuestionCount} questions
                    </span>
                    {exam.timeLimitMinutes && (
                      <span className="text-xs text-text-secondary">
                        {exam.timeLimitMinutes} min
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {exam.passingScorePercent}% to pass
                    </span>
                  </div>

                  {exam.description && (
                    <p className="text-sm text-text-secondary mb-3">
                      {exam.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {exam.topics.map((topic) => (
                      <span
                        key={topic.id}
                        className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary border border-border"
                      >
                        {topic.topicName} ({topic.questionCount})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTakeExam(exam.id)}
                    title="Take exam"
                  >
                    <Play size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditExam(exam)}
                    title="Edit exam"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteExamClick(exam.id)}
                    title="Delete exam"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitExam}
        exam={editingExam}
        subjectId={subjectIdNum || 0}
        availableTopics={topics}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && examToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-bg-primary rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Delete Exam</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{examToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setExamToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteExam}
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
