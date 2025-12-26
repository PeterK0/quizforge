import { Edit2, Trash2, Play, Clock, HelpCircle, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { Quiz } from '../../hooks/useQuizzes';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (quiz: Quiz) => void;
  onDelete: (id: number) => void;
  onTake: (quiz: Quiz) => void;
}

export function QuizCard({ quiz, onEdit, onDelete, onTake }: QuizCardProps) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-accent-blue transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Quiz Name */}
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {quiz.name}
          </h3>

          {/* Description */}
          {quiz.description && (
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">
              {quiz.description}
            </p>
          )}

          {/* Quiz Info */}
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <HelpCircle size={16} />
              <span>{quiz.questionCount} questions</span>
            </div>

            {quiz.timeLimitMinutes && (
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{quiz.timeLimitMinutes} min</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Award size={16} />
              <span>Pass: {quiz.passingScorePercent}%</span>
            </div>
          </div>

          {/* Settings */}
          <div className="mt-2 flex flex-wrap gap-2">
            {quiz.shuffleQuestions && (
              <span className="text-xs px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
                Shuffled
              </span>
            )}
            {quiz.showAnswersAfter === 'EACH_QUESTION' && (
              <span className="text-xs px-2 py-1 rounded bg-accent-green/20 text-accent-green">
                Show answers after each
              </span>
            )}
            {quiz.showAnswersAfter === 'END_OF_QUIZ' && (
              <span className="text-xs px-2 py-1 rounded bg-accent-yellow/20 text-accent-yellow">
                Show answers at end
              </span>
            )}
            {quiz.showAnswersAfter === 'NEVER' && (
              <span className="text-xs px-2 py-1 rounded bg-accent-red/20 text-accent-red">
                Answers hidden
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onTake(quiz)}
            size="sm"
            title="Take quiz"
          >
            <Play size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(quiz)}
            title="Edit quiz"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to delete this quiz? This action cannot be undone.'
                )
              ) {
                onDelete(quiz.id);
              }
            }}
            title="Delete quiz"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
