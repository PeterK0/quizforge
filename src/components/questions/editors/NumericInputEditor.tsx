import { Input } from '../../ui/Input';

interface NumericInputEditorProps {
  correctAnswer: string;
  tolerance: string;
  unit?: string;
  onChange: (data: { correctAnswer: string; tolerance: string; unit?: string }) => void;
}

export function NumericInputEditor({
  correctAnswer,
  tolerance,
  unit,
  onChange,
}: NumericInputEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Correct Answer *
        </label>
        <Input
          type="number"
          step="any"
          value={correctAnswer}
          onChange={(e) => onChange({ correctAnswer: e.target.value, tolerance, unit })}
          placeholder="Enter the correct numerical answer"
          required
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          The exact numerical answer expected
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Tolerance *
        </label>
        <Input
          type="number"
          step="any"
          value={tolerance}
          onChange={(e) => onChange({ correctAnswer, tolerance: e.target.value, unit })}
          placeholder="e.g., 0.1 or 0.01"
          required
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Acceptable margin of error (e.g., 0.1 means answer can be ±0.1 off)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Unit (Optional)
        </label>
        <Input
          type="text"
          value={unit || ''}
          onChange={(e) => onChange({ correctAnswer, tolerance, unit: e.target.value })}
          placeholder="e.g., meters, kg, °C"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          The unit of measurement (displayed to students but not required in answer)
        </p>
      </div>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Preview
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Correct Answer: <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {correctAnswer || '___'}
          </span>
          {unit && <span> {unit}</span>}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Accepted Range: <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
            {correctAnswer && tolerance
              ? `${(parseFloat(correctAnswer) - parseFloat(tolerance)).toFixed(2)} to ${(parseFloat(correctAnswer) + parseFloat(tolerance)).toFixed(2)}`
              : '___'}
          </span>
        </p>
      </div>
    </div>
  );
}
