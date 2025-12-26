import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface MatchPair {
  leftItem: string;
  rightItem: string;
}

interface MatchingEditorProps {
  pairs: MatchPair[];
  onChange: (pairs: MatchPair[]) => void;
}

export function MatchingEditor({ pairs, onChange }: MatchingEditorProps) {
  const addPair = () => {
    onChange([...pairs, { leftItem: '', rightItem: '' }]);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const updatePair = (index: number, field: 'leftItem' | 'rightItem', value: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    onChange(newPairs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Match Pairs
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create pairs where students match items from the left to the right
          </p>
        </div>
        <Button onClick={addPair} size="sm">
          <Plus size={16} className="inline mr-1" />
          Add Pair
        </Button>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No pairs yet. Add at least 2 pairs to create a matching question.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center font-bold flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-blue)',
                  color: 'white',
                }}
              >
                {index + 1}
              </div>

              <div className="flex-1 flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Left Item
                  </label>
                  <Input
                    value={pair.leftItem}
                    onChange={(e) => updatePair(index, 'leftItem', e.target.value)}
                    placeholder="e.g., Term or Question"
                  />
                </div>

                <div
                  className="px-3 py-2 rounded"
                  style={{
                    backgroundColor: 'var(--color-accent-blue)',
                    color: 'white',
                  }}
                >
                  ↔
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Right Item
                  </label>
                  <Input
                    value={pair.rightItem}
                    onChange={(e) => updatePair(index, 'rightItem', e.target.value)}
                    placeholder="e.g., Definition or Answer"
                  />
                </div>
              </div>

              <button
                onClick={() => removePair(index)}
                className="p-2 rounded hover:bg-opacity-20 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-red)',
                  color: 'white',
                }}
                title="Remove pair"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {pairs.length > 0 && pairs.length < 2 && (
        <p className="text-sm" style={{ color: 'var(--color-accent-yellow)' }}>
          ⚠️ Add at least 2 pairs for a valid matching question
        </p>
      )}

      {pairs.length >= 2 && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            💡 Student View
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Students will see all left items and all right items (shuffled), and must match them correctly.
          </p>
        </div>
      )}
    </div>
  );
}
