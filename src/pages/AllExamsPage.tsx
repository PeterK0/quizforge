import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Grid, List, FileText, Plus, Edit2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { ExamModal } from '../components/exams/ExamModal';
import { invoke } from '@tauri-apps/api/core';
import { Exam, UpdateExamData } from '../hooks/useExams';
import { getExamDefaults } from '../pages/SettingsPage';

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface Topic {
  id: number;
  name: string;
}

interface ExamWithDetails extends Exam {
  subjectColor: string;
}

type ViewMode = 'grid' | 'list';

export default function AllExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithDetails | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAllExams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exams, selectedSubject, searchQuery]);

  const loadAllExams = async () => {
    try {
      setLoading(true);
      // Load subjects
      const subjectsData = await invoke<Subject[]>('get_subjects');
      setSubjects(subjectsData);

      // Load all exams
      const allExams: ExamWithDetails[] = [];
      for (const subject of subjectsData) {
        const subjectExams = await invoke<Exam[]>('get_exams', { subjectId: subject.id });

        for (const exam of subjectExams) {
          allExams.push({
            ...exam,
            subjectColor: subject.color,
          });
        }
      }

      setExams(allExams);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exams];

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(e => e.subjectId === selectedSubject);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
      );
    }

    setFilteredExams(filtered);
  };

  const handleTakeExam = (exam: ExamWithDetails) => {
    navigate(`/subjects/${exam.subjectId}/exams/${exam.id}/take`);
  };

  const handleCreateExam = async (subjectId: number) => {
    try {
      // Get default settings
      const defaults = getExamDefaults();

      // Get available topics for this subject
      const topics = await invoke<any[]>('get_topics', { subjectId });

      if (topics.length === 0) {
        alert('This subject has no topics. Please add topics first.');
        setShowCreateModal(false);
        return;
      }

      // Get first topic with questions as default
      let selectedTopic = null;
      for (const topic of topics) {
        const questions = await invoke<any[]>('get_questions', { topicId: topic.id });
        if (questions.length > 0) {
          selectedTopic = topic;
          break;
        }
      }

      if (!selectedTopic) {
        alert('No topics have questions. Please add questions first.');
        setShowCreateModal(false);
        return;
      }

      // Create exam with defaults using first topic
      const examData = {
        subjectId,
        name: 'New Exam',
        description: '',
        totalQuestionCount: 10, // Default, will be updated by topics
        timeLimitMinutes: defaults.timeLimitMinutes,
        shuffleQuestions: defaults.shuffleQuestions,
        shuffleOptions: defaults.shuffleOptions,
        showAnswersAfter: defaults.showAnswersAfter,
        passingScorePercent: defaults.passingScorePercent,
        topics: [
          {
            topicId: selectedTopic.id,
            questionCount: 10,
          },
        ],
      };

      await invoke<any>('create_exam', { data: examData });
      setShowCreateModal(false);

      // Navigate to exam management page to edit
      navigate(`/subjects/${subjectId}/exams`);
    } catch (err) {
      console.error('Failed to create exam:', err);
      alert('Failed to create exam');
    }
  };

  const handleEditExam = async (exam: ExamWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExam(exam);
    // Load topics for this subject
    try {
      const topics = await invoke<Topic[]>('get_topics', { subjectId: exam.subjectId });
      setAvailableTopics(topics);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setAvailableTopics([]);
    }
    setEditModalOpen(true);
  };

  const handleUpdateExam = async (data: any) => {
    if (!editingExam) return;

    try {
      // Calculate total question count from topics
      const totalQuestionCount = data.topics.reduce((sum: number, topic: any) => sum + topic.questionCount, 0);

      const updateData: UpdateExamData = {
        name: data.name,
        description: data.description,
        totalQuestionCount,
        timeLimitMinutes: data.timeLimitMinutes,
        shuffleQuestions: data.shuffleQuestions,
        shuffleOptions: data.shuffleOptions,
        showAnswersAfter: data.showAnswersAfter,
        passingScorePercent: data.passingScorePercent,
        topics: data.topics,
      };

      await invoke('update_exam', {
        id: editingExam.id,
        data: updateData,
      });

      setEditModalOpen(false);
      setEditingExam(null);
      loadAllExams();
    } catch (err) {
      console.error('Failed to update exam:', err);
      alert('Failed to update exam');
    }
  };

  const handleDeleteExamClick = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExam = async () => {
    if (!editingExam) return;

    try {
      await invoke('delete_exam', { id: editingExam.id });
      setShowDeleteConfirm(false);
      setEditModalOpen(false);
      setEditingExam(null);
      loadAllExams();
    } catch (err) {
      console.error('Failed to delete exam:', err);
      alert('Failed to delete exam');
    }
  };

  if (loading) {
    return (
      <MainLayout title="All Exams">
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading exams...</p>
        </div>
      </MainLayout>
    );
  }

  const subjectGroups = filteredExams.reduce((acc, exam) => {
    const subjectName = subjects.find(s => s.id === exam.subjectId)?.name || 'Unknown';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(exam);
    return acc;
  }, {} as Record<string, ExamWithDetails[]>);

  return (
    <MainLayout
      title="All Exams"
      breadcrumbs={[{ label: 'Exams' }]}
      action={
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="inline mr-2" />
          Create Exam
        </Button>
      }
    >
      {/* Filters and Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <input
          type="text"
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        {/* Subject Filter */}
        <select
          value={selectedSubject || ''}
          onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={20} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('list')}
          >
            <List size={20} />
          </Button>
        </div>
      </div>

      {/* Exams Display */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
          <p className="text-lg mt-4" style={{ color: 'var(--color-text-secondary)' }}>
            No exams found
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(subjectGroups).map(([subjectName, subjectExams]) => (
            <div key={subjectName}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {subjectName}
              </h2>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {subjectExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-6 rounded-lg border flex gap-4"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {/* Main Content */}
                    <div className="flex-1">
                      {/* Subject Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: exam.subjectColor }}
                        />
                        <span className="text-sm font-medium" style={{ color: exam.subjectColor }}>
                          {subjects.find(s => s.id === exam.subjectId)?.name}
                        </span>
                      </div>

                      {/* Exam Name */}
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        {exam.name}
                      </h3>

                      {/* Description */}
                      {exam.description && (
                        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                          {exam.description}
                        </p>
                      )}

                      {/* Topics */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          Topics:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {exam.topics.map((topic) => (
                            <span
                              key={topic.id}
                              className="px-2 py-1 text-xs rounded"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {topic.topicName} ({topic.questionCount}Q)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>{exam.totalQuestionCount} questions</span>
                        {exam.timeLimitMinutes && <span>{exam.timeLimitMinutes} min</span>}
                        <span>Pass: {exam.passingScorePercent}%</span>
                      </div>
                    </div>

                    {/* Action Buttons - Vertical Stack */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleEditExam(exam, e)}
                        className="w-10 h-10 p-0 flex items-center justify-center"
                      >
                        <Edit2 size={18} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleTakeExam(exam)}
                        className="w-10 h-10 p-0 flex items-center justify-center"
                      >
                        <PlayCircle size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <QuickCreateExamModal
          subjects={subjects}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateExam}
        />
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <ExamModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingExam(null);
            setShowDeleteConfirm(false);
          }}
          onSubmit={handleUpdateExam}
          exam={editingExam}
          subjectId={editingExam.subjectId}
          availableTopics={availableTopics}
          onDelete={handleDeleteExamClick}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingExam && (
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
              Delete Exam
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete "{editingExam.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteExam}
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

interface QuickCreateExamModalProps {
  subjects: Subject[];
  onClose: () => void;
  onCreate: (subjectId: number) => void;
}

function QuickCreateExamModal({ subjects, onClose, onCreate }: QuickCreateExamModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const handleCreate = () => {
    if (selectedSubject) {
      onCreate(selectedSubject);
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
          Create New Exam
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

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You'll be able to select topics and configure the exam in the next step.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedSubject}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
