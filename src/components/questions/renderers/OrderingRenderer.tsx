import { useState, useEffect } from 'react';

interface OrderItem {
  id: number;
  text: string;
  correctPosition: number;
}

interface OrderingRendererProps {
  questionId: number;
  items: OrderItem[];
  value: number[]; // Array of item IDs in user's chosen order
  onChange: (value: number[]) => void;
}

export function OrderingRenderer({
  questionId,
  items,
  value,
  onChange,
}: OrderingRendererProps) {
  const [shuffledItems, setShuffledItems] = useState<OrderItem[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, number>>({}); // position -> itemId

  useEffect(() => {
    // Shuffle items only when question changes (not when value changes)
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);

    // Initialize assignments from value
    const newAssignments: Record<number, number> = {};
    value.forEach((itemId, index) => {
      if (itemId > 0) { // Only add valid item IDs (0 means unassigned)
        newAssignments[index + 1] = itemId; // positions are 1-indexed
      }
    });
    setAssignments(newAssignments);
    setSelectedPosition(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const handlePositionClick = (position: number) => {
    // If clicking the same position, deselect it
    if (selectedPosition === position) {
      setSelectedPosition(null);
    } else {
      setSelectedPosition(position);
    }
  };

  const handleItemClick = (itemId: number) => {
    if (selectedPosition === null) return;

    const newAssignments = { ...assignments };

    // If this position is already assigned to this item, unassign
    if (newAssignments[selectedPosition] === itemId) {
      delete newAssignments[selectedPosition];
    } else {
      // Assign the selected position to this item
      newAssignments[selectedPosition] = itemId;
    }

    setAssignments(newAssignments);

    // Convert assignments to ordered array for onChange
    const orderedArray: number[] = [];
    for (let i = 1; i <= items.length; i++) {
      orderedArray.push(newAssignments[i] || 0); // 0 means unassigned
    }
    onChange(orderedArray);

    setSelectedPosition(null);
  };

  const positions = Array.from({ length: items.length }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Click a position number on the left, then click an item on the right to assign it:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side - Positions */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Select a position:
          </p>
          {positions.map((position) => {
            const isSelected = selectedPosition === position;
            const assignedItemId = assignments[position];
            const assignedItem = items.find(item => item.id === assignedItemId);

            return (
              <button
                key={position}
                onClick={() => handlePositionClick(position)}
                className="w-full p-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--color-accent-green)'
                    : assignedItem
                    ? 'var(--color-bg-tertiary)'
                    : 'var(--color-bg-secondary)',
                  borderColor: isSelected
                    ? 'var(--color-accent-green)'
                    : assignedItem
                    ? 'var(--color-accent-blue)'
                    : 'var(--color-border)',
                  color: isSelected ? 'white' : 'var(--color-text-primary)',
                  borderWidth: isSelected || assignedItem ? '2px' : '1px',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? 'white' : 'var(--color-accent-blue)',
                      color: isSelected ? 'var(--color-accent-green)' : 'white',
                    }}
                  >
                    {position}
                  </div>
                  {assignedItem && (
                    <div className="flex-1">
                      <p className="font-medium">{assignedItem.text}</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side - Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedPosition ? `Click to assign to position ${selectedPosition}:` : 'Select a position first'}
          </p>
          {shuffledItems.map((item) => {
            const isAssigned = Object.values(assignments).includes(item.id);
            const canClick = selectedPosition !== null;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                disabled={!canClick}
                className="w-full p-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: isAssigned ? 'var(--color-accent-blue)' : 'var(--color-bg-tertiary)',
                  borderColor: isAssigned ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  color: isAssigned ? 'white' : 'var(--color-text-primary)',
                  borderWidth: '2px',
                  opacity: canClick || isAssigned ? 1 : 0.5,
                  cursor: canClick ? 'pointer' : 'not-allowed',
                }}
              >
                <p className="font-medium">{item.text}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{Object.keys(assignments).filter(k => assignments[Number(k)]).length} of {items.length} assigned</span>
        {selectedPosition && (
          <button
            onClick={() => setSelectedPosition(null)}
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
