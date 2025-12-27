import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface OrderItem {
  text: string;
  correctPosition: number;
}

interface OrderingEditorProps {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
}

export function OrderingEditor({ items, onChange }: OrderingEditorProps) {
  const addItem = () => {
    const newItems = [
      ...items,
      { text: '', correctPosition: items.length + 1 },
    ];
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Renumber positions
    newItems.forEach((item, i) => {
      item.correctPosition = i + 1;
    });
    onChange(newItems);
  };

  const updateItemText = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index].text = text;
    onChange(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    // Update correct positions
    newItems.forEach((item, i) => {
      item.correctPosition = i + 1;
    });

    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Order Items (Correct Sequence)
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Arrange items in the correct order. Students will be asked to reorder these.
          </p>
        </div>
        <Button type="button" onClick={addItem} size="sm">
          <Plus size={16} className="inline mr-1" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No items yet. Add at least 2 items to create an ordering question.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: 'var(--color-accent-blue)',
                    color: 'white',
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-opacity-10 disabled:opacity-30"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1 rounded hover:bg-opacity-10 disabled:opacity-30"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              <Input
                value={item.text}
                onChange={(e) => updateItemText(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                className="flex-1"
              />

              <button
                onClick={() => removeItem(index)}
                className="p-2 rounded hover:bg-opacity-20"
                style={{
                  backgroundColor: 'var(--color-accent-red)',
                  color: 'white',
                }}
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && items.length < 2 && (
        <p className="text-sm" style={{ color: 'var(--color-accent-yellow)' }}>
          ⚠️ Add at least 2 items for a valid ordering question
        </p>
      )}
    </div>
  );
}
