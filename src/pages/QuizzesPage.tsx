import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Grid, List } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { invoke } from '@tauri-apps/api/core';

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
        className="p-6 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: quiz.subjectColor,
        }}
        onClick={() => handleStartQuiz(quiz)}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: quiz.subjectColor, color: 'white' }}
          >
            <PlayCircle size={20} />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {quiz.name}
        </h3>
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
    </MainLayout>
  );
}
