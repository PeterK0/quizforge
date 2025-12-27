import { useState, useEffect } from 'react';
import { getImageUrl } from '../../../utils/images';

interface MatchPair {
  id: number;
  leftItem: string;
  rightItem: string;
  leftImagePath?: string;
  rightImagePath?: string;
}

interface MatchPairWithUrls extends MatchPair {
  leftImageUrl?: string;
  rightImageUrl?: string;
}

interface MatchingRendererProps {
  questionId: number;
  pairs: MatchPair[];
  value: Record<number, number>; // Map of left item ID to right item ID
  onChange: (value: Record<number, number>) => void;
}

export function MatchingRenderer({
  questionId,
  pairs,
  value,
  onChange,
}: MatchingRendererProps) {
  const [rightItems, setRightItems] = useState<MatchPairWithUrls[]>([]);
  const [leftItems, setLeftItems] = useState<MatchPairWithUrls[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      // Load images for all pairs
      const pairsWithUrls = await Promise.all(
        pairs.map(async (pair) => ({
          ...pair,
          leftImageUrl: await getImageUrl(pair.leftImagePath),
          rightImageUrl: await getImageUrl(pair.rightImagePath),
        }))
      );

      // Shuffle right items only when question changes (use questionId to detect this)
      const shuffled = [...pairsWithUrls].sort(() => Math.random() - 0.5);
      setRightItems(shuffled);
      setLeftItems(pairsWithUrls);
      // Reset selection when moving to a new question
      setSelectedLeftId(null);
    };

    loadImages();
  }, [questionId]); // Changed from [pairs] to [questionId] to only shuffle on new questions

  const handleLeftClick = (leftId: number) => {
    // If clicking the same left item, deselect it
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(leftId);
    }
  };

  const handleRightClick = (rightId: number) => {
    if (selectedLeftId === null) return;

    const newValue = { ...value };

    // If this left item is already matched to this right item, unmatch
    if (newValue[selectedLeftId] === rightId) {
      delete newValue[selectedLeftId];
    } else {
      // Match the selected left item to this right item
      newValue[selectedLeftId] = rightId;
    }

    onChange(newValue);
    setSelectedLeftId(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Click an item on the left, then click its match on the right:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Select an item:
          </p>
          {leftItems.map((pair) => {
            const isSelected = selectedLeftId === pair.id;
            const matchedRightId = value[pair.id];
            const matchedRightItem = rightItems.find(r => r.id === matchedRightId);

            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                className="w-full p-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--color-accent-green)'
                    : matchedRightId
                    ? 'var(--color-bg-tertiary)'
                    : 'var(--color-bg-secondary)',
                  borderColor: isSelected
                    ? 'var(--color-accent-green)'
                    : matchedRightId
                    ? 'var(--color-accent-blue)'
                    : 'var(--color-border)',
                  color: isSelected ? 'white' : 'var(--color-text-primary)',
                  borderWidth: isSelected || matchedRightId ? '2px' : '1px',
                }}
              >
                <div>
                  <p className="font-medium mb-1">
                    {pair.leftItem}
                  </p>
                  {pair.leftImageUrl && (
                    <img
                      src={pair.leftImageUrl}
                      alt="Left item"
                      className="max-w-full max-h-24 rounded mt-1"
                    />
                  )}
                </div>
                {matchedRightItem && (
                  <div
                    className="text-sm px-2 py-1 rounded inline-flex items-center gap-2 mt-2"
                    style={{
                      backgroundColor: 'var(--color-accent-blue)',
                      color: 'white',
                    }}
                  >
                    ↔ {matchedRightItem.rightItem}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedLeftId ? 'Click to match:' : 'Select a left item first'}
          </p>
          {rightItems.map((pair) => {
            const isMatched = Object.values(value).includes(pair.id);
            const canClick = selectedLeftId !== null;

            return (
              <button
                key={pair.id}
                onClick={() => handleRightClick(pair.id)}
                disabled={!canClick}
                className="w-full p-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: isMatched ? 'var(--color-accent-blue)' : 'var(--color-bg-tertiary)',
                  borderColor: isMatched ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  color: isMatched ? 'white' : 'var(--color-text-primary)',
                  borderWidth: '2px',
                  opacity: canClick || isMatched ? 1 : 0.5,
                  cursor: canClick ? 'pointer' : 'not-allowed',
                }}
              >
                <div>
                  <p className="font-medium">{pair.rightItem}</p>
                  {pair.rightImageUrl && (
                    <img
                      src={pair.rightImageUrl}
                      alt="Right item"
                      className="max-w-full max-h-24 rounded mt-1"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{Object.keys(value).length} of {pairs.length} matched</span>
        {selectedLeftId && (
          <button
            onClick={() => setSelectedLeftId(null)}
            className="px-2 py-1 rounded"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            Cancel selection
          </button>
        )}
      </div>
    </div>
  );
}
