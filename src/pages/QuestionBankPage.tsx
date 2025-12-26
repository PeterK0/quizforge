import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionModal } from '../components/questions/QuestionModal';
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
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithDetails | null>(
    null
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');

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

  const handleDeleteQuestion = async (id: number) => {
    await deleteQuestion(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            Add Question
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
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={20} />
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
                onDelete={handleDeleteQuestion}
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
    </>
  );
}
