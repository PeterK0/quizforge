import { Topic } from '../../types';
import { Edit2, Trash2, HelpCircle, BookOpen } from 'lucide-react';

interface TopicItemProps {
  topic: Topic;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuizzesClick?: () => void;
}

export function TopicItem({ topic, onClick, onEdit, onDelete, onQuizzesClick }: TopicItemProps) {
  return (
    <div
      className="p-4 rounded-lg border transition-all hover:shadow-md group flex items-center justify-between"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Week Badge */}
        {topic.weekNumber && (
          <div
            className="px-3 py-1 rounded text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent-blue)',
              color: 'white',
            }}
          >
            W{topic.weekNumber.toString().padStart(2, '0')}
          </div>
        )}

        {/* Topic Info */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {topic.name}
          </h4>
          {topic.description && (
            <p className="text-sm line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
              {topic.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-3 py-2 rounded flex items-center gap-2"
          style={{
            backgroundColor: 'var(--color-accent-blue)',
            color: 'white',
          }}
          title="View Questions"
        >
          <HelpCircle size={16} />
          <span className="text-sm">Questions</span>
        </button>
        {onQuizzesClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuizzesClick();
            }}
            className="px-3 py-2 rounded flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-accent-green)',
              color: 'white',
            }}
            title="View Quizzes"
          >
            <BookOpen size={16} />
            <span className="text-sm">Quizzes</span>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
          }}
          title="Edit topic"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'var(--color-accent-red)',
            color: 'white',
          }}
          title="Delete topic"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
