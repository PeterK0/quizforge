import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Grid, List, Plus, Edit2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { QuizModal } from '../components/quizzes/QuizModal';
import { invoke } from '@tauri-apps/api/core';
import { UpdateQuizData } from '../hooks/useQuizzes';
import { getQuizDefaults } from '../pages/SettingsPage';

interface Quiz {
  id: number;
  topicId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimitMinutes?: number;
  passingScorePercent: number;
  createdAt: string;
}

interface Topic {
  id: number;
  subjectId: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface QuizWithDetails extends Quiz {
  topicName: string;
  subjectName: string;
  subjectColor: string;
  subjectId: number;
}

type GroupBy = 'subject' | 'topic' | 'none';
type ViewMode = 'grid' | 'list';

export default function QuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>('subject');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizWithDetails | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAllQuizzes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quizzes, selectedSubject, searchQuery]);

  const loadAllQuizzes = async () => {
    try {
      setLoading(true);
      // Load subjects
      const subjectsData = await invoke<Subject[]>('get_subjects');
      setSubjects(subjectsData);

      // Load all topics
      const allTopics: Topic[] = [];
      for (const subject of subjectsData) {
        const topics = await invoke<Topic[]>('get_topics', { subjectId: subject.id });
        allTopics.push(...topics);
      }

      // Load all quizzes
      const allQuizzes: QuizWithDetails[] = [];
      for (const topic of allTopics) {
        const topicQuizzes = await invoke<Quiz[]>('get_quizzes', { topicId: topic.id });
        const subject = subjectsData.find(s => s.id === topic.subjectId);

        for (const quiz of topicQuizzes) {
          allQuizzes.push({
            ...quiz,
            topicName: topic.name,
            subjectName: subject?.name || 'Unknown',
            subjectColor: subject?.color || '#3B82F6',
            subjectId: topic.subjectId,
          });
        }
      }

      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quizzes];

    // Filter by subject
    if (selectedSubject !== null) {
      filtered = filtered.filter(q => q.subjectId === selectedSubject);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        q =>
          q.name.toLowerCase().includes(query) ||
          q.description?.toLowerCase().includes(query) ||
          q.topicName.toLowerCase().includes(query) ||
          q.subjectName.toLowerCase().includes(query)
      );
    }

    setFilteredQuizzes(filtered);
  };

  const handleStartQuiz = (quiz: QuizWithDetails) => {
    navigate(`/subjects/${quiz.subjectId}/topics/${quiz.topicId}/quizzes/${quiz.id}/take`);
  };

  const handleManageQuiz = (quiz: QuizWithDetails) => {
    navigate(`/subjects/${quiz.subjectId}/topics/${quiz.topicId}`);
  };

  const handleCreateQuiz = async (subjectId: number, topicId: number) => {
    try {
      // Get default settings
      const defaults = getQuizDefaults();

      // Get available question count for this topic
      const questions = await invoke<any[]>('get_questions', { topicId });
      const availableCount = questions.length;

      if (availableCount === 0) {
        alert('This topic has no questions. Please add questions first.');
        setShowCreateModal(false);
        return;
      }

      // Create quiz with defaults
      const quizData = {
        topicId,
        name: 'New Quiz',
        description: '',
        questionCount: Math.min(defaults.questionCount, availableCount),
        timeLimitMinutes: defaults.timeLimitMinutes,
        shuffleQuestions: defaults.shuffleQuestions,
        shuffleOptions: defaults.shuffleOptions,
        showAnswersAfter: defaults.showAnswersAfter,
        passingScorePercent: defaults.passingScorePercent,
      };

      const newQuiz = await invoke<any>('create_quiz', { data: quizData });
      setShowCreateModal(false);

      // Navigate to quiz management page to edit
      navigate(`/subjects/${subjectId}/topics/${topicId}/quizzes`);
    } catch (err) {
      console.error('Failed to create quiz:', err);
      alert('Failed to create quiz');
    }
  };

  const handleEditQuiz = async (quiz: QuizWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingQuiz(quiz);
    // Load question count for this topic
    try {
      const questions = await invoke<any[]>('get_questions', { topicId: quiz.topicId });
      setQuestionCount(questions.length);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestionCount(0);
    }
    setEditModalOpen(true);
  };

  const handleUpdateQuiz = async (data: any) => {
    if (!editingQuiz) return;

    try {
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

      await invoke('update_quiz', {
        id: editingQuiz.id,
        data: updateData,
      });

      setEditModalOpen(false);
      setEditingQuiz(null);
      loadAllQuizzes();
    } catch (err) {
      console.error('Failed to update quiz:', err);
      alert('Failed to update quiz');
    }
  };

  const handleDeleteQuizClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!editingQuiz) return;

    try {
      await invoke('delete_quiz', { id: editingQuiz.id });
      setShowDeleteConfirm(false);
      setEditModalOpen(false);
      setEditingQuiz(null);
      loadAllQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      alert('Failed to delete quiz');
    }
  };

  const renderGroupedQuizzes = () => {
    if (groupBy === 'none') {
      return (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredQuizzes.map(quiz => renderQuizCard(quiz))}
        </div>
      );
    }

    if (groupBy === 'subject') {
      const grouped = new Map<number, QuizWithDetails[]>();
      filteredQuizzes.forEach(quiz => {
        if (!grouped.has(quiz.subjectId)) {
          grouped.set(quiz.subjectId, []);
        }
        grouped.get(quiz.subjectId)!.push(quiz);
      });

      return (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([subjectId, subjectQuizzes]) => {
            const subject = subjects.find(s => s.id === subjectId);
            return (
              <div key={subjectId}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-8 rounded"
                    style={{ backgroundColor: subject?.color || '#3B82F6' }}
                  />
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {subject?.name || 'Unknown Subject'}
                  </h2>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {subjectQuizzes.length} {subjectQuizzes.length === 1 ? 'quiz' : 'quizzes'}
                  </span>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {subjectQuizzes.map(quiz => renderQuizCard(quiz))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (groupBy === 'topic') {
      const grouped = new Map<string, QuizWithDetails[]>();
      filteredQuizzes.forEach(quiz => {
        const key = `${quiz.subjectId}-${quiz.topicId}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(quiz);
      });

      return (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([key, topicQuizzes]) => {
            const quiz = topicQuizzes[0];
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-8 rounded"
                    style={{ backgroundColor: quiz.subjectColor }}
                  />
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {quiz.topicName}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {quiz.subjectName} • {topicQuizzes.length} {topicQuizzes.length === 1 ? 'quiz' : 'quizzes'}
                    </p>
                  </div>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {topicQuizzes.map(quiz => renderQuizCard(quiz))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  const renderQuizCard = (quiz: QuizWithDetails) => {
    if (viewMode === 'list') {
      return (
        <div
          key={quiz.id}
          className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent-blue transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: quiz.subjectColor }}
          >
            <PlayCircle size={24} color="white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {quiz.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {quiz.subjectName} › {quiz.topicName} • {quiz.questionCount} questions
              {quiz.timeLimitMinutes && ` • ${quiz.timeLimitMinutes} min`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleManageQuiz(quiz)} variant="secondary">
              Manage
            </Button>
            <Button size="sm" onClick={() => handleStartQuiz(quiz)}>
              <PlayCircle size={16} />
              Start
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={quiz.id}
        className="p-6 rounded-lg border-2 transition-all flex gap-4"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: quiz.subjectColor,
        }}
      >
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: quiz.subjectColor, color: 'white' }}
            >
              <PlayCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {quiz.name}
              </h3>
            </div>
          </div>
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {quiz.description || 'No description'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              {quiz.topicName}
            </span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              {quiz.questionCount} questions
            </span>
            {quiz.timeLimitMinutes && (
              <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                {quiz.timeLimitMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons - Vertical Stack */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => handleEditQuiz(quiz, e)}
            className="w-10 h-10 p-0 flex items-center justify-center"
          >
            <Edit2 size={18} />
          </Button>
          <Button
            size="sm"
            onClick={() => handleStartQuiz(quiz)}
            className="w-10 h-10 p-0 flex items-center justify-center"
          >
            <PlayCircle size={18} />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout title="Quizzes">
        <div className="text-center text-text-secondary py-12">Loading quizzes...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="All Quizzes"
      breadcrumbs={[{ label: 'Home' }, { label: 'Quizzes' }]}
      action={
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="inline mr-2" />
          Create Quiz
        </Button>
      }
    >
      {/* Filters and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and View Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Subject Filter */}
          <select
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="subject">Group by Subject</option>
            <option value="topic">Group by Topic</option>
            <option value="none">No Grouping</option>
          </select>

          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border-2 ${viewMode === 'grid' ? 'border-accent-blue' : 'border-border'}`}
              style={{
                backgroundColor: viewMode === 'grid' ? 'var(--color-accent-blue)' : 'var(--color-bg-secondary)',
                color: viewMode === 'grid' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border-2 ${viewMode === 'list' ? 'border-accent-blue' : 'border-border'}`}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--color-accent-blue)' : 'var(--color-bg-secondary)',
                color: viewMode === 'list' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Showing {filteredQuizzes.length} of {quizzes.length} quizzes
        </p>
      </div>

      {/* Quizzes Display */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            No quizzes found
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {searchQuery || selectedSubject ? 'Try adjusting your filters' : 'Create your first quiz to get started'}
          </p>
        </div>
      ) : (
        renderGroupedQuizzes()
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <QuickCreateModal
          subjects={subjects}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateQuiz}
        />
      )}

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <QuizModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingQuiz(null);
            setShowDeleteConfirm(false);
          }}
          onSubmit={handleUpdateQuiz}
          quiz={editingQuiz}
          topicId={editingQuiz.topicId}
          availableQuestionCount={questionCount}
          onDelete={handleDeleteQuizClick}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingQuiz && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Delete Quiz
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete "{editingQuiz.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteQuiz}
                style={{ backgroundColor: 'var(--color-accent-red)', color: 'white' }}
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

interface QuickCreateModalProps {
  subjects: Subject[];
  onClose: () => void;
  onCreate: (subjectId: number, topicId: number) => void;
}

function QuickCreateModal({ subjects, onClose, onCreate }: QuickCreateModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic(null);
    }
  }, [selectedSubject]);

  const loadTopics = async (subjectId: number) => {
    try {
      setLoading(true);
      const topicsData = await invoke<Topic[]>('get_topics', { subjectId });
      setTopics(topicsData);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (selectedSubject && selectedTopic) {
      onCreate(selectedSubject, selectedTopic);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Create New Quiz
        </h2>

        <div className="space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Subject
            </label>
            <select
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selection */}
          {selectedSubject && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Topic
              </label>
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading topics...</p>
              ) : topics.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No topics available</p>
              ) : (
                <select
                  value={selectedTopic || ''}
                  onChange={(e) => setSelectedTopic(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedSubject || !selectedTopic}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
