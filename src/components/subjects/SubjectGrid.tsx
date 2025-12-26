import { Subject } from '../../types';
import { SubjectCard } from './SubjectCard';

interface SubjectGridProps {
  subjects: Subject[];
  onSubjectClick: (subject: Subject) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
}

export function SubjectGrid({
  subjects,
  onSubjectClick,
  onEditSubject,
  onDeleteSubject,
}: SubjectGridProps) {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          No subjects yet
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Create your first subject to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onClick={() => onSubjectClick(subject)}
          onEdit={() => onEditSubject(subject)}
          onDelete={() => onDeleteSubject(subject)}
        />
      ))}
    </div>
  );
}
