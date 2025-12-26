import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, breadcrumbs, action, showBack, onBack }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Back Button */}
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight size={14} />}
                <span>{crumb.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
        </div>
      </div>

      {/* Action Button */}
      {action && <div>{action}</div>}
    </header>
  );
}
