import { useState, useEffect } from 'react';
import { Edit2, Trash2, CheckCircle, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { QuestionWithDetails } from '../../hooks/useQuestions';
import { getImageUrl } from '../../utils/images';

interface QuestionCardProps {
  question: QuestionWithDetails;
  onEdit: (question: QuestionWithDetails) => void;
  onDelete: (id: number) => void;
  onTest: (question: QuestionWithDetails) => void;
}

const DIFFICULTY_COLORS = {
  EASY: 'text-accent-green',
  MEDIUM: 'text-accent-yellow',
  HARD: 'text-accent-red',
};

const QUESTION_TYPE_LABELS = {
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_CHOICE: 'Multiple Choice',
  FILL_BLANK: 'Fill in Blank',
  FILL_BLANK_MULTIPLE: 'Fill Multiple',
  NUMERIC_INPUT: 'Numeric Input',
  MATCHING: 'Matching',
  ORDERING: 'Ordering',
  IMAGE_IDENTIFICATION: 'Image ID',
  CALCULATION: 'Calculation',
};

export function QuestionCard({ question, onEdit, onDelete, onTest }: QuestionCardProps) {
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>();

  useEffect(() => {
    const loadImageUrl = async () => {
      if (question.questionImagePath) {
        const url = await getImageUrl(question.questionImagePath);
        setQuestionImageUrl(url);
      } else {
        setQuestionImageUrl(undefined);
      }
    };

    loadImageUrl();
  }, [question]);

  const difficultyColor =
    DIFFICULTY_COLORS[question.difficulty as keyof typeof DIFFICULTY_COLORS] ||
    'text-text-secondary';

  const typeLabel =
    QUESTION_TYPE_LABELS[
      question.questionType as keyof typeof QUESTION_TYPE_LABELS
    ] || question.questionType;

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-accent-blue transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
              {typeLabel}
            </span>
            <span className={`text-xs font-medium ${difficultyColor}`}>
              {question.difficulty}
            </span>
            <span className="text-xs text-text-secondary">
              {question.points} {question.points === 1 ? 'point' : 'points'}
            </span>
          </div>

          {/* Question Text */}
          <p className="text-text-primary mb-3 line-clamp-3">
            {question.questionText}
          </p>

          {/* Question Image Preview */}
          {questionImageUrl && (
            <img
              src={questionImageUrl}
              alt="Question preview"
              className="max-w-full max-h-32 rounded mb-3"
            />
          )}

          {/* Options or Blanks preview */}
          {question.options.length > 0 && (
            <div className="space-y-1 mb-3">
              {question.options.slice(0, 3).map((option) => (
                <div key={option.id} className="flex items-center gap-2 text-sm">
                  {option.isCorrect && (
                    <CheckCircle size={14} className="text-accent-green" />
                  )}
                  <span
                    className={
                      option.isCorrect ? 'text-accent-green' : 'text-text-secondary'
                    }
                  >
                    {option.optionText}
                  </span>
                </div>
              ))}
              {question.options.length > 3 && (
                <p className="text-xs text-text-secondary">
                  +{question.options.length - 3} more options
                </p>
              )}
            </div>
          )}

          {question.blanks.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-text-secondary">
                {question.blanks.length} blank{question.blanks.length > 1 ? 's' : ''}{' '}
                to fill
              </p>
            </div>
          )}

          {/* Source */}
          {question.source && (
            <p className="text-xs text-text-secondary">Source: {question.source}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onTest(question)}
            title="Test question"
          >
            <Play size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(question)}
            title="Edit question"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(question.id)}
            title="Delete question"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
