interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-10 h-10 rounded border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? 'white' : 'transparent',
            }}
            title={color}
          />
        ))}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded border-2 cursor-pointer"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </div>
      </div>
    </div>
  );
}
