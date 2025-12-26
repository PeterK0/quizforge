interface NumericInputRendererProps {
  questionId: number;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
}

export function NumericInputRenderer({
  unit,
  value,
  onChange,
}: NumericInputRendererProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border-2 text-lg font-mono"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: value ? 'var(--color-accent-blue)' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          placeholder="Enter your answer"
        />
        {unit && (
          <span
            className="text-lg font-medium px-3 py-3 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Enter a numerical value{unit ? ` (in ${unit})` : ''}
      </p>
    </div>
  );
}
