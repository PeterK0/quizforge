import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  CreateQuestionData,
  QuestionWithDetails,
  CreateQuestionOption,
  CreateQuestionBlank,
  CreateNumericData,
  CreateOrderItem,
  CreateMatchPair,
} from '../../hooks/useQuestions';
import { SingleChoiceEditor } from './editors/SingleChoiceEditor';
import { MultipleChoiceEditor } from './editors/MultipleChoiceEditor';
import { FillBlankEditor } from './editors/FillBlankEditor';
import { NumericInputEditor } from './editors/NumericInputEditor';
import { OrderingEditor } from './editors/OrderingEditor';
import { MatchingEditor } from './editors/MatchingEditor';
import { ImageUpload } from '../ui/ImageUpload';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuestionData) => Promise<void>;
  question?: QuestionWithDetails | null;
  subjectId: number;
  topicId: number;
}

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'NUMERIC_INPUT' | 'ORDERING' | 'MATCHING';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export function QuestionModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  subjectId,
  topicId,
}: QuestionModalProps) {
  const [questionType, setQuestionType] = useState<QuestionType>('SINGLE_CHOICE');
  const [questionText, setQuestionText] = useState('');
  const [questionImagePath, setQuestionImagePath] = useState<string | undefined>(undefined);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [points, setPoints] = useState(1);
  const [source, setSource] = useState('');
  const [options, setOptions] = useState<CreateQuestionOption[]>([]);
  const [blanks, setBlanks] = useState<CreateQuestionBlank[]>([]);
  const [numericData, setNumericData] = useState<CreateNumericData>({ correctAnswer: '', tolerance: '0.1', unit: '' });
  const [orderItems, setOrderItems] = useState<CreateOrderItem[]>([]);
  const [matchPairs, setMatchPairs] = useState<CreateMatchPair[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (question) {
      setQuestionType(question.questionType as QuestionType);
      setQuestionText(question.questionText);
      setQuestionImagePath(question.questionImagePath);
      setExplanation(question.explanation || '');
      setDifficulty(question.difficulty as Difficulty);
      setPoints(question.points);
      setSource(question.source || '');
      setOptions(
        question.options.map((opt) => ({
          optionText: opt.optionText,
          optionImagePath: opt.optionImagePath,
          isCorrect: opt.isCorrect,
          displayOrder: opt.displayOrder,
        }))
      );
      setBlanks(
        question.blanks.map((blank) => ({
          blankIndex: blank.blankIndex,
          correctAnswer: blank.correctAnswer,
          acceptableAnswers: blank.acceptableAnswers,
          isNumeric: blank.isNumeric,
          numericTolerance: blank.numericTolerance,
          unit: blank.unit,
          inputType: blank.inputType,
          dropdownOptions: blank.dropdownOptions,
        }))
      );
      setOrderItems(
        question.orderItems.map((item) => ({
          text: item.itemText,
          correctPosition: item.correctPosition,
        }))
      );
      setMatchPairs(
        question.matches.map((match) => ({
          leftItem: match.leftItem,
          rightItem: match.rightItem,
          leftImagePath: match.leftImagePath,
          rightImagePath: match.rightImagePath,
        }))
      );
    } else {
      resetForm();
    }
  }, [question, isOpen]);

  const resetForm = () => {
    setQuestionType('SINGLE_CHOICE');
    setQuestionText('');
    setQuestionImagePath(undefined);
    setExplanation('');
    setDifficulty('MEDIUM');
    setPoints(1);
    setSource('');
    setOptions([]);
    setBlanks([]);
    setNumericData({ correctAnswer: '', tolerance: '0.1', unit: '' });
    setOrderItems([]);
    setMatchPairs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert('Please enter question text');
      return;
    }

    // Validation based on question type
    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        alert('Please add at least 2 options');
        return;
      }
      if (!options.some((opt) => opt.isCorrect)) {
        alert('Please mark at least one option as correct');
        return;
      }
      if (questionType === 'SINGLE_CHOICE') {
        const correctCount = options.filter((opt) => opt.isCorrect).length;
        if (correctCount !== 1) {
          alert('Single choice questions must have exactly one correct answer');
          return;
        }
      }
    } else if (questionType === 'FILL_BLANK') {
      if (blanks.length === 0) {
        alert('Please add at least one blank answer');
        return;
      }
    } else if (questionType === 'NUMERIC_INPUT') {
      if (!numericData.correctAnswer || !numericData.tolerance) {
        alert('Please provide correct answer and tolerance');
        return;
      }
    } else if (questionType === 'ORDERING') {
      if (orderItems.length < 2) {
        alert('Please add at least 2 items for ordering');
        return;
      }
    } else if (questionType === 'MATCHING') {
      if (matchPairs.length < 2) {
        alert('Please add at least 2 pairs for matching');
        return;
      }
    }

    const data: CreateQuestionData = {
      subjectId: subjectId,
      topicId: topicId,
      questionType: questionType,
      questionText: questionText,
      questionImagePath: questionImagePath,
      explanation: explanation || undefined,
      difficulty,
      points,
      source: source || undefined,
      options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionType) ? options : [],
      blanks: questionType === 'FILL_BLANK' ? blanks : [],
      numericData: questionType === 'NUMERIC_INPUT' ? numericData : undefined,
      orderItems: questionType === 'ORDERING' ? orderItems : undefined,
      matchPairs: questionType === 'MATCHING' ? matchPairs : undefined,
    };

    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    // Clear type-specific data when switching types
    setOptions([]);
    setBlanks([]);
    setNumericData({ correctAnswer: '', tolerance: '0.1', unit: '' });
    setOrderItems([]);
    setMatchPairs([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={question ? 'Edit Question' : 'Create Question'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Question Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_BLANK', 'NUMERIC_INPUT', 'ORDERING', 'MATCHING'] as const).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleQuestionTypeChange(type)}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                      questionType === type
                        ? 'border-accent-blue bg-accent-blue/20 text-accent-blue'
                        : 'border-border bg-bg-secondary text-text-secondary hover:border-accent-blue/50'
                    }`}
                  >
                    {type === 'SINGLE_CHOICE'
                      ? 'Single Choice'
                      : type === 'MULTIPLE_CHOICE'
                      ? 'Multiple Choice'
                      : type === 'FILL_BLANK'
                      ? 'Fill Blank'
                      : type === 'NUMERIC_INPUT'
                      ? 'Numeric'
                      : type === 'ORDERING'
                      ? 'Ordering'
                      : 'Matching'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Question Text *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={
                questionType === 'FILL_BLANK'
                  ? 'Enter your question with ___ or [blank] for blanks'
                  : 'Enter your question'
              }
              rows={4}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
              required
            />
          </div>

          {/* Question Image */}
          <ImageUpload
            value={questionImagePath}
            onChange={setQuestionImagePath}
            label="Question Image (Optional)"
            placeholder="Add image to question"
          />

          {/* Type-specific editors */}
          {questionType === 'SINGLE_CHOICE' && (
            <SingleChoiceEditor options={options} onChange={setOptions} />
          )}

          {questionType === 'MULTIPLE_CHOICE' && (
            <MultipleChoiceEditor options={options} onChange={setOptions} />
          )}

          {questionType === 'FILL_BLANK' && (
            <FillBlankEditor blanks={blanks} onChange={setBlanks} />
          )}

          {questionType === 'NUMERIC_INPUT' && (
            <NumericInputEditor
              correctAnswer={numericData.correctAnswer}
              tolerance={numericData.tolerance}
              unit={numericData.unit}
              onChange={setNumericData}
            />
          )}

          {questionType === 'ORDERING' && (
            <OrderingEditor items={orderItems} onChange={setOrderItems} />
          )}

          {questionType === 'MATCHING' && (
            <MatchingEditor pairs={matchPairs} onChange={setMatchPairs} />
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Explanation (optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the correct answer"
              rows={3}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
            />
          </div>

          {/* Difficulty and Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Difficulty *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Points *
              </label>
              <Input
                type="number"
                min="1"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Source (optional)
            </label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Textbook Chapter 5, Lecture 3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
