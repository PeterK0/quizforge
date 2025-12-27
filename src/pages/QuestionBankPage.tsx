import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionModal } from '../components/questions/QuestionModal';
import { QuestionTestModal } from '../components/questions/QuestionTestModal';
import {
  useQuestions,
  QuestionWithDetails,
  CreateQuestionData,
  UpdateQuestionData,
} from '../hooks/useQuestions';
import { invoke } from '@tauri-apps/api/core';

interface Topic {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
  week_number?: number;
}

interface Subject {
  id: number;
  name: string;
}

export default function QuestionBankPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithDetails | null>(
    null
  );
  const [testingQuestion, setTestingQuestion] = useState<QuestionWithDetails | null>(
    null
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithDetails | null>(null);

  const topicIdNum = topicId ? parseInt(topicId) : null;
  const subjectIdNum = subjectId ? parseInt(subjectId) : 0;

  const { questions, loading, error, createQuestion, updateQuestion, deleteQuestion } =
    useQuestions(topicIdNum);

  useEffect(() => {
    if (topicIdNum) {
      loadTopic(topicIdNum);
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

  const handleCreateQuestion = async (data: CreateQuestionData) => {
    const result = await createQuestion(data);
    if (result) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateQuestion = async (data: CreateQuestionData) => {
    if (!editingQuestion) return;

    const updateData: UpdateQuestionData = {
      questionText: data.questionText,
      questionImagePath: data.questionImagePath,
      explanation: data.explanation,
      difficulty: data.difficulty,
      points: data.points,
      source: data.source,
      options: data.options,
      blanks: data.blanks,
      numericData: data.numericData,
      orderItems: data.orderItems,
      matchPairs: data.matchPairs,
    };

    const result = await updateQuestion(editingQuestion.id, updateData);
    if (result) {
      setIsModalOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleEditClick = (question: QuestionWithDetails) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleTestClick = (question: QuestionWithDetails) => {
    setTestingQuestion(question);
    setIsTestModalOpen(true);
  };

  const handleDeleteQuestionClick = (id: number) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    await deleteQuestion(questionToDelete.id);
    setShowDeleteConfirm(false);
    setQuestionToDelete(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleTestModalClose = () => {
    setIsTestModalOpen(false);
    setTestingQuestion(null);
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (filterType !== 'ALL' && q.questionType !== filterType) return false;
    if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) return false;
    return true;
  });

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
    { label: 'Questions' },
  ];

  if (!topicIdNum) {
    return (
      <MainLayout title="Question Bank" breadcrumbs={breadcrumbs}>
        <div className="text-center text-text-secondary py-12">
          Invalid topic ID
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <MainLayout
        title={`Question Bank: ${topic?.name || 'Loading...'}`}
        breadcrumbs={breadcrumbs}
        showBack={true}
        action={
          <Button onClick={() => setIsModalOpen(true)} className="min-w-[170px] h-[40px] flex items-center justify-center">
            <Plus size={20} className="mr-2" />
            New Question
          </Button>
        }
      >
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="ALL">All Types</option>
            <option value="SINGLE_CHOICE">Single Choice</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="FILL_BLANK">Fill in Blank</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <div className="ml-auto text-sm text-text-secondary">
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center text-text-secondary py-12">
            Loading questions...
          </div>
        ) : error ? (
          <div className="text-center text-accent-red py-12">Error: {error}</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">
              {questions.length === 0
                ? 'No questions yet. Create your first question to get started!'
                : 'No questions match the current filters.'}
            </p>
            {questions.length === 0 && (
              <Button onClick={() => setIsModalOpen(true)} className="min-w-[200px] h-[40px] flex items-center justify-center">
                <Plus size={20} className="mr-2" />
                Create First Question
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={handleEditClick}
                onDelete={handleDeleteQuestionClick}
                onTest={handleTestClick}
              />
            ))}
          </div>
        )}
      </MainLayout>

      {/* Question Modal */}
      {isModalOpen && (
        <QuestionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
          question={editingQuestion}
          subjectId={subjectIdNum}
          topicId={topicIdNum}
        />
      )}

      {/* Question Test Modal */}
      {isTestModalOpen && testingQuestion && (
        <QuestionTestModal
          isOpen={isTestModalOpen}
          onClose={handleTestModalClose}
          question={testingQuestion}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && questionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-bg-primary rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Delete Question</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQuestionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteQuestion}
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
