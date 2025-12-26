import { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

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
  items,
  value,
  onChange,
}: OrderingRendererProps) {
  const [orderedItems, setOrderedItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    // Initialize with shuffled items if no value
    if (value.length === 0) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      setOrderedItems(shuffled);
      onChange(shuffled.map(item => item.id));
    } else {
      // Reconstruct order from value
      const ordered = value.map(id => items.find(item => item.id === id)!).filter(Boolean);
      setOrderedItems(ordered);
    }
  }, []);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setOrderedItems(newItems);
    onChange(newItems.map(item => item.id));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Drag items to arrange them in the correct order:
      </p>
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-move hover:border-accent-blue transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            moveItem(fromIndex, index);
          }}
        >
          <GripVertical size={20} style={{ color: 'var(--color-text-secondary)' }} />
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-accent-blue)',
              color: 'white',
            }}
          >
            {index + 1}
          </div>
          <p className="flex-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}
