import { NavLink } from 'react-router-dom';
import { BookOpen, BarChart3, GraduationCap } from 'lucide-react';

const navItems = [
  { path: '/subjects', icon: BookOpen, label: 'Subjects' },
  { path: '/quizzes', icon: GraduationCap, label: 'Quizzes' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Sidebar() {
  return (
    <aside
      className="w-64 h-screen border-r flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="h-16 px-6 border-b flex items-center" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <BookOpen size={20} style={{ color: 'var(--color-accent-blue)' }} />
          QuizForge
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'nav-link-active' : 'nav-link'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--color-accent-blue)' : 'transparent',
                  color: isActive ? 'white' : 'var(--color-text-primary)',
                })}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <p>Version 0.1.0</p>
      </div>
    </aside>
  );
}
