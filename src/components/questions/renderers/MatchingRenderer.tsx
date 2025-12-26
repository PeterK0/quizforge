import { useState, useEffect } from 'react';

interface MatchPair {
  id: number;
  leftItem: string;
  rightItem: string;
}

interface MatchingRendererProps {
  questionId: number;
  pairs: MatchPair[];
  value: Record<number, number>; // Map of left item ID to right item ID
  onChange: (value: Record<number, number>) => void;
}

export function MatchingRenderer({
  pairs,
  value,
  onChange,
}: MatchingRendererProps) {
  const [rightItems, setRightItems] = useState<MatchPair[]>([]);

  useEffect(() => {
    // Shuffle right items on mount
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setRightItems(shuffled);
  }, []);

  const handleMatch = (leftId: number, rightId: number) => {
    const newValue = { ...value };

    // If selecting the same item, unselect it
    if (newValue[leftId] === rightId) {
      delete newValue[leftId];
    } else {
      newValue[leftId] = rightId;
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Match each item on the left with the correct item on the right:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Select an item:
          </p>
          {pairs.map((pair) => {
            const selectedRightId = value[pair.id];
            const selectedRightItem = rightItems.find(r => r.id === selectedRightId);

            return (
              <div
                key={pair.id}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: selectedRightId ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  borderWidth: selectedRightId ? '2px' : '1px',
                }}
              >
                <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {pair.leftItem}
                </p>
                {selectedRightItem && (
                  <div
                    className="text-sm px-2 py-1 rounded inline-flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-accent-blue)',
                      color: 'white',
                    }}
                  >
                    ↔ {selectedRightItem.rightItem}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Click to match:
          </p>
          {rightItems.map((pair) => {
            const isMatched = Object.values(value).includes(pair.id);

            return (
              <button
                key={pair.id}
                onClick={() => {
                  // Find which left item should match this right item
                  const leftId = Object.keys(value).find(k => value[parseInt(k)] === pair.id);
                  if (leftId) {
                    // If already matched, clicking again unmatches
                    handleMatch(parseInt(leftId), pair.id);
                  } else {
                    // Find the first unmatched left item or the last selected one
                    const lastSelectedLeft = pairs.find(p => value[p.id] !== undefined)?.id || pairs[0].id;
                    handleMatch(lastSelectedLeft, pair.id);
                  }
                }}
                className="w-full p-3 rounded-lg border text-left transition-all hover:scale-105"
                style={{
                  backgroundColor: isMatched ? 'var(--color-accent-blue)' : 'var(--color-bg-tertiary)',
                  borderColor: isMatched ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  color: isMatched ? 'white' : 'var(--color-text-primary)',
                  borderWidth: '2px',
                }}
              >
                {pair.rightItem}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
        {Object.keys(value).length} of {pairs.length} matched
      </p>
    </div>
  );
}
