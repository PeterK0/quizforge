import { Subject } from '../../types';
import { getIconComponent } from '../ui/IconPicker';
import { Trash2, Edit2 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SubjectCard({ subject, onClick, onEdit, onDelete }: SubjectCardProps) {
  const IconComponent = getIconComponent(subject.icon);

  return (
    <div
      className="p-6 rounded-lg border cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative group"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: subject.color,
        borderWidth: '2px',
      }}
      onClick={onClick}
    >
      {/* Icon and Name */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: subject.color, color: 'white' }}
        >
          <IconComponent size={24} />
        </div>
        <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {subject.name}
        </h3>
      </div>

      {/* Description */}
      {subject.description && (
        <p
          className="text-sm line-clamp-2 mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {subject.description}
        </p>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded hover:bg-opacity-20"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded hover:bg-opacity-20"
          style={{
            backgroundColor: 'var(--color-accent-red)',
            color: 'white',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
