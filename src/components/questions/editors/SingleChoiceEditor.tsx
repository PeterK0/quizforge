import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ImageUpload } from '../../ui/ImageUpload';
import { CreateQuestionOption } from '../../../hooks/useQuestions';

interface SingleChoiceEditorProps {
  options: CreateQuestionOption[];
  onChange: (options: CreateQuestionOption[]) => void;
}

export function SingleChoiceEditor({ options, onChange }: SingleChoiceEditorProps) {
  const [newOptionText, setNewOptionText] = useState('');

  const addOption = () => {
    if (!newOptionText.trim()) return;

    const newOption: CreateQuestionOption = {
      optionText: newOptionText,
      optionImagePath: undefined,
      isCorrect: options.length === 0, // First option is correct by default
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

  const setCorrectOption = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    onChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Answer Options
        </label>

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
                  onClick={() => setCorrectOption(index)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    option.isCorrect
                      ? 'border-accent-green bg-accent-green'
                      : 'border-border hover:border-accent-green'
                  }`}
                  title="Mark as correct answer"
                >
                  {option.isCorrect && <Check size={14} className="text-white" />}
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

      {options.length >= 2 && !options.some((opt) => opt.isCorrect) && (
        <p className="text-sm text-accent-red">
          Please mark one option as the correct answer
        </p>
      )}
    </div>
  );
}
