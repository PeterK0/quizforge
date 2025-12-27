import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2 } from 'lucide-react';
import { Quiz, CreateQuizData } from '../../hooks/useQuizzes';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuizData) => Promise<void>;
  quiz?: Quiz | null;
  topicId: number;
  availableQuestionCount: number;
  onDelete?: () => Promise<void>;
}

export function QuizModal({
  isOpen,
  onClose,
  onSubmit,
  quiz,
  topicId,
  availableQuestionCount,
  onDelete,
}: QuizModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(undefined);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswersAfter, setShowAnswersAfter] = useState<'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER'>('END_OF_QUIZ');
  const [passingScorePercent, setPassingScorePercent] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quiz) {
      setName(quiz.name);
      setDescription(quiz.description || '');
      setQuestionCount(quiz.questionCount);
      setTimeLimitMinutes(quiz.timeLimitMinutes);
      setShuffleQuestions(quiz.shuffleQuestions);
      setShuffleOptions(quiz.shuffleOptions);
      setShowAnswersAfter(quiz.showAnswersAfter);
      setPassingScorePercent(quiz.passingScorePercent);
    } else {
      resetForm();
    }
  }, [quiz, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setQuestionCount(Math.min(10, availableQuestionCount));
    setTimeLimitMinutes(undefined);
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setShowAnswersAfter('END_OF_QUIZ');
    setPassingScorePercent(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a quiz name');
      return;
    }

    if (questionCount < 1) {
      alert('Question count must be at least 1');
      return;
    }

    if (questionCount > availableQuestionCount) {
      alert(`Only ${availableQuestionCount} questions available in this topic`);
      return;
    }

    if (passingScorePercent < 0 || passingScorePercent > 100) {
      alert('Passing score must be between 0 and 100');
      return;
    }

    const data: CreateQuizData = {
      topicId,
      name,
      description: description || undefined,
      questionCount,
      timeLimitMinutes,
      shuffleQuestions,
      shuffleOptions,
      showAnswersAfter,
      passingScorePercent,
    };

    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quiz ? 'Edit Quiz' : 'Create New Quiz'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quiz Name */}
        <Input
          label="Quiz Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Midterm Practice Quiz"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the quiz"
            rows={3}
            className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
          />
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Number of Questions * ({availableQuestionCount} available)
          </label>
          <Input
            type="number"
            min="1"
            max={availableQuestionCount}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Time Limit (minutes, optional)
          </label>
          <Input
            type="number"
            min="1"
            value={timeLimitMinutes || ''}
            onChange={(e) =>
              setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="No time limit"
          />
        </div>

        {/* Shuffle Options */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle-questions"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="rounded border-border"
            />
            <label
              htmlFor="shuffle-questions"
              className="text-sm text-text-primary cursor-pointer"
            >
              Shuffle question order
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle-options"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="rounded border-border"
            />
            <label
              htmlFor="shuffle-options"
              className="text-sm text-text-primary cursor-pointer"
            >
              Shuffle answer options
            </label>
          </div>
        </div>

        {/* Show Answers After */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Show Answers *
          </label>
          <select
            value={showAnswersAfter}
            onChange={(e) =>
              setShowAnswersAfter(
                e.target.value as 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER'
              )
            }
            className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="END_OF_QUIZ">After quiz completion</option>
            <option value="EACH_QUESTION">After each question</option>
            <option value="NEVER">Never show answers</option>
          </select>
        </div>

        {/* Passing Score */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Passing Score (%) *
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={passingScorePercent}
            onChange={(e) => setPassingScorePercent(parseInt(e.target.value) || 60)}
            required
          />
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-border">
          {/* Delete Button - Only show when editing */}
          {quiz && onDelete && (
            <div className="mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2"
                style={{ color: 'var(--color-accent-red)', borderColor: 'var(--color-accent-red)' }}
              >
                <Trash2 size={16} />
                <span>Delete Quiz</span>
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : quiz ? 'Update Quiz' : 'Create Quiz'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
