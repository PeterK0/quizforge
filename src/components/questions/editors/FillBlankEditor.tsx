import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { CreateQuestionBlank } from '../../../hooks/useQuestions';

interface FillBlankEditorProps {
  blanks: CreateQuestionBlank[];
  onChange: (blanks: CreateQuestionBlank[]) => void;
}

export function FillBlankEditor({ blanks, onChange }: FillBlankEditorProps) {
  const [newBlankAnswer, setNewBlankAnswer] = useState('');
  const [newBlankAcceptable, setNewBlankAcceptable] = useState('');

  const addBlank = () => {
    if (!newBlankAnswer.trim()) return;

    const newBlank: CreateQuestionBlank = {
      blankIndex: blanks.length,
      correctAnswer: newBlankAnswer,
      acceptableAnswers: newBlankAcceptable.trim() || undefined,
      isNumeric: false,
      numericTolerance: undefined,
      unit: undefined,
      inputType: 'INPUT',
      dropdownOptions: undefined,
    };

    onChange([...blanks, newBlank]);
    setNewBlankAnswer('');
    setNewBlankAcceptable('');
  };

  const removeBlank = (index: number) => {
    const newBlanks = blanks.filter((_, i) => i !== index);
    // Reorder blankIndex
    const reorderedBlanks = newBlanks.map((blank, i) => ({
      ...blank,
      blankIndex: i,
    }));
    onChange(reorderedBlanks);
  };

  const updateBlank = (
    index: number,
    field: keyof CreateQuestionBlank,
    value: string | boolean | number | undefined
  ) => {
    const newBlanks = [...blanks];
    newBlanks[index] = { ...newBlanks[index], [field]: value };
    onChange(newBlanks);
  };

  return (
    <div className="space-y-4">
      <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-accent-blue mt-0.5 flex-shrink-0" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">
              How to use Fill in the Blank:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Use <code className="bg-bg-secondary px-1 py-0.5 rounded">___</code> or{' '}
                <code className="bg-bg-secondary px-1 py-0.5 rounded">[blank]</code> in
                your question text to indicate where blanks should appear
              </li>
              <li>Add the correct answer for each blank below</li>
              <li>
                Optionally add acceptable alternative answers (comma-separated)
              </li>
              <li>Blanks will be matched in order of appearance</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Blank Answers (in order)
        </label>

        {blanks.length === 0 && (
          <p className="text-sm text-text-secondary">
            No blanks added yet. Add at least one blank.
          </p>
        )}

        <div className="space-y-3">
          {blanks.map((blank, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-bg-secondary space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  Blank {index + 1}
                </span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeBlank(index)}
                  title="Remove blank"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Input Type *
                  </label>
                  <select
                    value={blank.inputType || 'INPUT'}
                    onChange={(e) =>
                      updateBlank(index, 'inputType', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  >
                    <option value="INPUT">Text Input</option>
                    <option value="DROPDOWN">Dropdown</option>
                  </select>
                </div>

                {blank.inputType === 'DROPDOWN' ? (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Dropdown Options (comma-separated) *
                    </label>
                    <Input
                      value={blank.dropdownOptions || ''}
                      onChange={(e) =>
                        updateBlank(index, 'dropdownOptions', e.target.value)
                      }
                      placeholder="e.g., Option A, Option B, Option C"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Enter the options that will appear in the dropdown. The correct answer must match one of these options exactly.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Acceptable Alternative Answers (comma-separated)
                    </label>
                    <Input
                      value={blank.acceptableAnswers || ''}
                      onChange={(e) =>
                        updateBlank(index, 'acceptableAnswers', e.target.value)
                      }
                      placeholder="e.g., answer1, answer2, answer3"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      These will be accepted as correct answers in addition to the main
                      answer
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Correct Answer *
                  </label>
                  <Input
                    value={blank.correctAnswer}
                    onChange={(e) =>
                      updateBlank(index, 'correctAnswer', e.target.value)
                    }
                    placeholder="Enter the correct answer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`numeric-${index}`}
                    checked={blank.isNumeric}
                    onChange={(e) =>
                      updateBlank(index, 'isNumeric', e.target.checked)
                    }
                    className="rounded border-border"
                    disabled={blank.inputType === 'DROPDOWN'}
                  />
                  <label
                    htmlFor={`numeric-${index}`}
                    className={`text-xs cursor-pointer ${
                      blank.inputType === 'DROPDOWN' ? 'text-text-tertiary' : 'text-text-secondary'
                    }`}
                  >
                    This is a numeric answer
                  </label>
                </div>

                {blank.isNumeric && blank.inputType !== 'DROPDOWN' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Tolerance (±)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={blank.numericTolerance || ''}
                        onChange={(e) =>
                          updateBlank(
                            index,
                            'numericTolerance',
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        placeholder="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Unit (optional)
                      </label>
                      <Input
                        value={blank.unit || ''}
                        onChange={(e) => updateBlank(index, 'unit', e.target.value)}
                        placeholder="e.g., kg, m/s"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Correct Answer
          </label>
          <Input
            value={newBlankAnswer}
            onChange={(e) => setNewBlankAnswer(e.target.value)}
            placeholder="Enter the correct answer for next blank"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addBlank();
              }
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Acceptable Alternatives (optional)
          </label>
          <Input
            value={newBlankAcceptable}
            onChange={(e) => setNewBlankAcceptable(e.target.value)}
            placeholder="Comma-separated alternative answers"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addBlank();
              }
            }}
          />
        </div>
        <Button type="button" onClick={addBlank} size="sm" className="w-full">
          <Plus size={16} />
          Add Blank {blanks.length > 0 ? `#${blanks.length + 1}` : ''}
        </Button>
      </div>

      {blanks.length === 0 && (
        <p className="text-sm text-accent-yellow">
          Add at least one blank answer
        </p>
      )}
    </div>
  );
}
