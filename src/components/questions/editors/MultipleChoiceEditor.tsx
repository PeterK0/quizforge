import { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ImageUpload } from '../../ui/ImageUpload';
import { CreateQuestionOption } from '../../../hooks/useQuestions';

interface MultipleChoiceEditorProps {
  options: CreateQuestionOption[];
  onChange: (options: CreateQuestionOption[]) => void;
}

export function MultipleChoiceEditor({ options, onChange }: MultipleChoiceEditorProps) {
  const [newOptionText, setNewOptionText] = useState('');

  const addOption = () => {
    if (!newOptionText.trim()) return;

    const newOption: CreateQuestionOption = {
      optionText: newOptionText,
      optionImagePath: undefined,
      isCorrect: false,
      displayOrder: options.length,
    };

    onChange([...options, newOption]);
    setNewOptionText('');
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    // Reorder displayOrder
    const reorderedOptions = newOptions.map((opt, i) => ({
      ...opt,
      displayOrder: i,
    }));
    onChange(reorderedOptions);
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], optionText: text };
    onChange(newOptions);
  };

  const updateOptionImage = (index: number, imagePath: string | undefined) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], optionImagePath: imagePath };
    onChange(newOptions);
  };

  const toggleCorrectOption = (index: number) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      isCorrect: !newOptions[index].isCorrect,
    };
    onChange(newOptions);
  };

  const correctCount = options.filter((opt) => opt.isCorrect).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Answer Options
        </label>
        <p className="text-xs text-text-secondary">
          Multiple options can be marked as correct
        </p>

        {options.length === 0 && (
          <p className="text-sm text-text-secondary">
            No options added yet. Add at least 2 options.
          </p>
        )}

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                option.isCorrect
                  ? 'border-accent-green bg-accent-green/10'
                  : 'border-border bg-bg-secondary'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleCorrectOption(index)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    option.isCorrect
                      ? 'border-accent-green bg-accent-green'
                      : 'border-border hover:border-accent-green'
                  }`}
                  title="Toggle correct answer"
                >
                  {option.isCorrect ? (
                    <CheckSquare size={14} className="text-white" />
                  ) : (
                    <Square size={14} className="text-text-secondary" />
                  )}
                </button>

                <Input
                  value={option.optionText}
                  onChange={(e) => updateOptionText(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeOption(index)}
                  title="Remove option"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="pl-8">
                <ImageUpload
                  value={option.optionImagePath}
                  onChange={(path) => updateOptionImage(index, path)}
                  placeholder="Add image"
                  compact={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          placeholder="Enter new option text"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOption();
            }
          }}
          className="flex-1"
        />
        <Button type="button" onClick={addOption} size="sm">
          <Plus size={16} />
          Add Option
        </Button>
      </div>

      {options.length > 0 && options.length < 2 && (
        <p className="text-sm text-accent-yellow">
          Add at least one more option (minimum 2 required)
        </p>
      )}

      {options.length >= 2 && correctCount === 0 && (
        <p className="text-sm text-accent-red">
          Please mark at least one option as correct
        </p>
      )}

      {correctCount > 0 && (
        <p className="text-sm text-accent-green">
          {correctCount} correct answer{correctCount > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
