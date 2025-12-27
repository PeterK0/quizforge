import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2 } from 'lucide-react';
import { Exam, CreateExamData, UpdateExamData, CreateExamTopicData } from '../../hooks/useExams';

interface Topic {
  id: number;
  name: string;
}

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExamData | UpdateExamData) => Promise<void>;
  exam?: Exam | null;
  subjectId: number;
  availableTopics: Topic[];
  onDelete?: () => Promise<void>;
}

export function ExamModal({
  isOpen,
  onClose,
  onSubmit,
  exam,
  subjectId,
  availableTopics,
  onDelete,
}: ExamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>();
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswersAfter, setShowAnswersAfter] = useState<'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER'>('END_OF_QUIZ');
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [selectedTopics, setSelectedTopics] = useState<CreateExamTopicData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exam) {
      setName(exam.name);
      setDescription(exam.description || '');
      setTimeLimitMinutes(exam.timeLimitMinutes);
      setShuffleQuestions(exam.shuffleQuestions);
      setShuffleOptions(exam.shuffleOptions);
      setShowAnswersAfter(exam.showAnswersAfter);
      setPassingScorePercent(exam.passingScorePercent);
      setSelectedTopics(
        exam.topics.map((t) => ({
          topicId: t.topicId,
          questionCount: t.questionCount,
        }))
      );
    } else {
      resetForm();
    }
  }, [exam, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTimeLimitMinutes(undefined);
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setShowAnswersAfter('END_OF_QUIZ');
    setPassingScorePercent(70);
    setSelectedTopics([]);
  };

  const handleAddTopic = () => {
    // Find first topic that's not already selected
    const unselectedTopic = availableTopics.find(
      (t) => !selectedTopics.some((st) => st.topicId === t.id)
    );

    if (unselectedTopic) {
      setSelectedTopics([
        ...selectedTopics,
        { topicId: unselectedTopic.id, questionCount: 5 },
      ]);
    }
  };

  const handleRemoveTopic = (index: number) => {
    setSelectedTopics(selectedTopics.filter((_, i) => i !== index));
  };

  const handleTopicChange = (index: number, topicId: number) => {
    const updated = [...selectedTopics];
    updated[index] = { ...updated[index], topicId };
    setSelectedTopics(updated);
  };

  const handleQuestionCountChange = (index: number, count: number) => {
    const updated = [...selectedTopics];
    updated[index] = { ...updated[index], questionCount: Math.max(1, count) };
    setSelectedTopics(updated);
  };

  const getTotalQuestionCount = () => {
    return selectedTopics.reduce((sum, t) => sum + t.questionCount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter exam name');
      return;
    }

    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    const totalQuestionCount = getTotalQuestionCount();

    const data: CreateExamData | UpdateExamData = exam
      ? {
          name: name.trim(),
          description: description.trim() || undefined,
          totalQuestionCount,
          timeLimitMinutes,
          shuffleQuestions,
          shuffleOptions,
          showAnswersAfter,
          passingScorePercent,
          topics: selectedTopics,
        }
      : {
          subjectId,
          name: name.trim(),
          description: description.trim() || undefined,
          totalQuestionCount,
          timeLimitMinutes,
          shuffleQuestions,
          shuffleOptions,
          showAnswersAfter,
          passingScorePercent,
          topics: selectedTopics,
        };

    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTopicsForDropdown = (currentTopicId?: number) => {
    return availableTopics.filter(
      (t) =>
        t.id === currentTopicId ||
        !selectedTopics.some((st) => st.topicId === t.id)
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={exam ? 'Edit Exam' : 'Create Exam'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Exam Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Exam Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Midterm Exam, Final Exam"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
            />
          </div>

          {/* Topics Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">
                Topics & Questions *
              </label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddTopic}
                disabled={selectedTopics.length >= availableTopics.length}
                className="min-w-[110px]"
              >
                <Plus size={16} className="mr-1" />
                Add Topic
              </Button>
            </div>

            {selectedTopics.length === 0 ? (
              <p className="text-sm text-text-secondary py-4 text-center border-2 border-dashed border-border rounded-lg">
                No topics selected. Add at least one topic.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTopics.map((selectedTopic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg border border-border"
                  >
                    <select
                      value={selectedTopic.topicId}
                      onChange={(e) =>
                        handleTopicChange(index, parseInt(e.target.value))
                      }
                      className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      {getAvailableTopicsForDropdown(selectedTopic.topicId).map(
                        (topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        )
                      )}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={selectedTopic.questionCount}
                        onChange={(e) =>
                          handleQuestionCountChange(
                            index,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      />
                      <span className="text-sm text-text-secondary whitespace-nowrap">
                        questions
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveTopic(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}

                <div className="text-sm text-text-secondary text-right pt-2">
                  Total: {getTotalQuestionCount()} questions
                </div>
              </div>
            )}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Time Limit (minutes)
            </label>
            <Input
              type="number"
              min="1"
              value={timeLimitMinutes || ''}
              onChange={(e) =>
                setTimeLimitMinutes(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="No time limit"
            />
          </div>

          {/* Passing Score */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Passing Score (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={passingScorePercent}
              onChange={(e) =>
                setPassingScorePercent(
                  Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
              required
            />
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
              Settings
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-text-primary">
                Shuffle questions
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-text-primary">
                Shuffle answer options
              </span>
            </label>

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Show answers:
              </label>
              <select
                value={showAnswersAfter}
                onChange={(e) =>
                  setShowAnswersAfter(
                    e.target.value as 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER'
                  )
                }
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="EACH_QUESTION">After each question</option>
                <option value="END_OF_QUIZ">At the end of exam</option>
                <option value="NEVER">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border pt-4">
          {/* Delete Button - Only show when editing */}
          {exam && onDelete && (
            <div className="mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2"
                style={{ color: 'var(--color-accent-red)', borderColor: 'var(--color-accent-red)' }}
              >
                <Trash2 size={16} />
                <span>Delete Exam</span>
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : exam ? 'Update Exam' : 'Create Exam'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
