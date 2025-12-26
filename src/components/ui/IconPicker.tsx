import {
  BookOpen,
  Calculator,
  Atom,
  FlaskConical,
  Globe,
  Languages,
  Palette,
  Music,
  Dumbbell,
  Briefcase,
  Code,
  Brain,
  Heart,
  Sparkles,
  Zap,
  Star,
} from 'lucide-react';

const ICONS = [
  { name: 'BookOpen', component: BookOpen },
  { name: 'Calculator', component: Calculator },
  { name: 'Atom', component: Atom },
  { name: 'FlaskConical', component: FlaskConical },
  { name: 'Globe', component: Globe },
  { name: 'Languages', component: Languages },
  { name: 'Palette', component: Palette },
  { name: 'Music', component: Music },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Code', component: Code },
  { name: 'Brain', component: Brain },
  { name: 'Heart', component: Heart },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Zap', component: Zap },
  { name: 'Star', component: Star },
];

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
      )}
      <div className="grid grid-cols-8 gap-2">
        {ICONS.map(({ name, component: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className="p-3 rounded border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: value === name ? 'var(--color-accent-blue)' : 'var(--color-bg-tertiary)',
              borderColor: value === name ? 'var(--color-accent-blue)' : 'var(--color-border)',
              color: value === name ? 'white' : 'var(--color-text-primary)',
            }}
            title={name}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Export icon components for use in other components
export function getIconComponent(iconName?: string) {
  const icon = ICONS.find((i) => i.name === iconName);
  return icon?.component || BookOpen;
}
