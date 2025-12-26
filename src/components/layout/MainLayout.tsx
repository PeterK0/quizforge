import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function MainLayout({ children, title, breadcrumbs, action, showBack, onBack }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} action={action} showBack={showBack} onBack={onBack} />
        <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
