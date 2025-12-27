import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import { QuestionWithDetails } from '../../hooks/useQuestions';
import { NumericInputRenderer } from './renderers/NumericInputRenderer';
import { OrderingRenderer } from './renderers/OrderingRenderer';
import { MatchingRenderer } from './renderers/MatchingRenderer';
import { getImageUrl } from '../../utils/images';

interface QuestionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionWithDetails;
}

export function QuestionTestModal({
  isOpen,
  onClose,
  question,
}: QuestionTestModalProps) {
  const [answer, setAnswer] = useState<string | string[] | number[] | Record<number, number>>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>();
  const [optionImageUrls, setOptionImageUrls] = useState<Map<number, string>>(new Map());

  // Load image URLs when question changes
  useEffect(() => {
    const loadImageUrls = async () => {
      // Load question image
      if (question.questionImagePath) {
        const url = await getImageUrl(question.questionImagePath);
        setQuestionImageUrl(url);
      } else {
        setQuestionImageUrl(undefined);
      }

      // Load option images
      const urlMap = new Map<number, string>();
      for (const option of question.options) {
        if (option.optionImagePath) {
          const url = await getImageUrl(option.optionImagePath);
          if (url) {
            urlMap.set(option.id, url);
          }
        }
      }
      setOptionImageUrls(urlMap);
    };

    loadImageUrls();
  }, [question]);

  const handleReset = () => {
    setAnswer(question.questionType === 'MULTIPLE_CHOICE' ? [] : '');
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const checkAnswer = () => {
    let correct = false;

    switch (question.questionType) {
      case 'SINGLE_CHOICE':
        const correctOptionId = question.options.find((opt) => opt.isCorrect)?.id;
        correct = answer === correctOptionId?.toString();
        break;

      case 'MULTIPLE_CHOICE':
        const correctOptionIds = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id.toString())
          .sort();
        const selectedIds = (answer as string[]).sort();
        correct =
          correctOptionIds.length === selectedIds.length &&
          correctOptionIds.every((id, index) => id === selectedIds[index]);
        break;

      case 'FILL_BLANK':
        const userAnswers = answer as string[];
        correct = question.blanks.every((blank, index) => {
          const userAnswer = userAnswers[index]?.trim().toLowerCase() || '';
          const correctAnswer = blank.correctAnswer.trim().toLowerCase();
          const acceptableAnswers = blank.acceptableAnswers
            ? blank.acceptableAnswers
                .split(',')
                .map((a) => a.trim().toLowerCase())
            : [];

          if (blank.isNumeric && blank.numericTolerance) {
            const userNum = parseFloat(userAnswer);
            const correctNum = parseFloat(correctAnswer);
            const tolerance = blank.numericTolerance;
            return Math.abs(userNum - correctNum) <= tolerance;
          }

          return (
            userAnswer === correctAnswer ||
            acceptableAnswers.includes(userAnswer)
          );
        });
        break;

      case 'NUMERIC_INPUT':
        if (question.blanks.length > 0) {
          const blank = question.blanks[0];
          const userNum = parseFloat(answer as string);
          const correctNum = parseFloat(blank.correctAnswer);
          const tolerance = blank.numericTolerance || 0.1;
          correct = Math.abs(userNum - correctNum) <= tolerance;
        }
        break;

      case 'ORDERING':
        const userOrder = answer as number[];
        correct = question.orderItems.every((item) => {
          const userIndex = userOrder.indexOf(item.id);
          return userIndex === item.correctPosition - 1;
        });
        break;

      case 'MATCHING':
        const userMatches = answer as Record<number, number>;
        correct = question.matches.every((match) => {
          return userMatches[match.id] === match.id;
        });
        break;

      default:
        correct = false;
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Test Question">
      <div className="space-y-6">
        {/* Question Text */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
              {question.questionType.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-secondary">
              {question.difficulty}
            </span>
            <span className="text-xs text-text-secondary">
              {question.points} {question.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <p className="text-base text-text-primary whitespace-pre-wrap">
            {question.questionText}
          </p>
          {questionImageUrl && (
            <img
              src={questionImageUrl}
              alt="Question"
              className="max-w-full max-h-64 rounded-lg mt-3"
            />
          )}
        </div>

        {/* Answer Input based on question type */}
        {!isSubmitted && (
          <div>
            {(question.questionType === 'SINGLE_CHOICE' ||
              question.questionType === 'MULTIPLE_CHOICE') && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected =
                    question.questionType === 'SINGLE_CHOICE'
                      ? answer === option.id.toString()
                      : Array.isArray(answer) &&
                        (answer as string[]).includes(option.id.toString());

                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-accent-blue bg-accent-blue/10'
                          : 'border-border hover:border-accent-blue/50'
                      }`}
                    >
                      <input
                        type={
                          question.questionType === 'SINGLE_CHOICE'
                            ? 'radio'
                            : 'checkbox'
                        }
                        name={`question-${question.id}`}
                        checked={isSelected}
                        onChange={() => {
                          if (question.questionType === 'SINGLE_CHOICE') {
                            setAnswer(option.id.toString());
                          } else {
                            const current = (answer as string[]) || [];
                            const updated = isSelected
                              ? current.filter((id) => id !== option.id.toString())
                              : [...current, option.id.toString()];
                            setAnswer(updated);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <span className="text-text-primary block">
                          {option.optionText}
                        </span>
                        {optionImageUrls.get(option.id) && (
                          <img
                            src={optionImageUrls.get(option.id)}
                            alt="Option"
                            className="max-w-full max-h-32 rounded mt-2"
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {question.questionType === 'FILL_BLANK' && (
              <div className="space-y-4">
                {question.blanks.map((blank, index) => {
                  const dropdownOptions = blank.dropdownOptions
                    ? blank.dropdownOptions.split(',').map(opt => opt.trim())
                    : [];

                  return (
                    <div key={blank.id}>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Blank {index + 1}
                        {blank.unit && ` (${blank.unit})`}
                      </label>
                      {blank.inputType === 'DROPDOWN' ? (
                        <select
                          value={
                            Array.isArray(answer) ? answer[index] || '' : ''
                          }
                          onChange={(e) => {
                            const current = (answer as string[]) || [];
                            const updated = [...current];
                            updated[index] = e.target.value;
                            setAnswer(updated);
                          }}
                          className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                        >
                          <option value="">-- Select an option --</option>
                          {dropdownOptions.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={blank.isNumeric ? 'number' : 'text'}
                          step={blank.isNumeric ? 'any' : undefined}
                          value={
                            Array.isArray(answer) ? answer[index] || '' : ''
                          }
                          onChange={(e) => {
                            const current = (answer as string[]) || [];
                            const updated = [...current];
                            updated[index] = e.target.value;
                            setAnswer(updated);
                          }}
                          className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {question.questionType === 'NUMERIC_INPUT' &&
              question.blanks.length > 0 && (
                <NumericInputRenderer
                  questionId={question.id}
                  unit={question.blanks[0].unit}
                  value={(answer as string) || ''}
                  onChange={(value) => setAnswer(value)}
                />
              )}

            {question.questionType === 'ORDERING' && (
              <OrderingRenderer
                questionId={question.id}
                items={question.orderItems.map(item => ({
                  id: item.id,
                  text: item.itemText,
                  correctPosition: item.correctPosition,
                }))}
                value={(answer as number[]) || []}
                onChange={(value) => setAnswer(value)}
              />
            )}

            {question.questionType === 'MATCHING' && (
              <MatchingRenderer
                questionId={question.id}
                pairs={question.matches}
                value={(answer as Record<number, number>) || {}}
                onChange={(value) => setAnswer(value)}
              />
            )}
          </div>
        )}

        {/* Result */}
        {isSubmitted && (
          <div
            className={`p-4 rounded-lg border-2 ${
              isCorrect
                ? 'bg-accent-green/10 border-accent-green'
                : 'bg-accent-red/10 border-accent-red'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="text-accent-green" size={24} />
                  <span className="font-semibold text-accent-green">
                    Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="text-accent-red" size={24} />
                  <span className="font-semibold text-accent-red">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            {/* Show correct answer for choice questions */}
            {!isCorrect &&
              (question.questionType === 'SINGLE_CHOICE' ||
                question.questionType === 'MULTIPLE_CHOICE') && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-text-secondary mb-2">
                    Correct answer(s):
                  </p>
                  <div className="space-y-1">
                    {question.options
                      .filter((opt) => opt.isCorrect)
                      .map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle size={16} className="text-accent-green" />
                          <span className="text-text-primary">
                            {opt.optionText}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Show correct matches for matching questions */}
            {!isCorrect && question.questionType === 'MATCHING' && (
              <div className="mt-3">
                <p className="text-sm font-medium text-text-secondary mb-2">
                  Correct matches:
                </p>
                <div className="space-y-2">
                  {question.matches.map((match) => {
                    const userMatch = (answer as Record<number, number>)[match.id];
                    const isCorrectMatch = userMatch === match.id;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center gap-2 text-sm p-2 rounded"
                        style={{
                          backgroundColor: isCorrectMatch
                            ? 'var(--color-accent-green-light, rgba(34, 197, 94, 0.1))'
                            : 'var(--color-accent-red-light, rgba(239, 68, 68, 0.1))',
                        }}
                      >
                        <div className="flex-1 flex items-center gap-2">
                          {isCorrectMatch ? (
                            <CheckCircle size={16} className="text-accent-green" />
                          ) : (
                            <XCircle size={16} className="text-accent-red" />
                          )}
                          <span className="font-medium">{match.leftItem}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>↔</span>
                          <span className="font-medium">{match.rightItem}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show explanation if available */}
            {question.explanation && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium text-text-secondary mb-1">
                  Explanation:
                </p>
                <p className="text-sm text-text-primary">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!isSubmitted ? (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={checkAnswer}>Submit Answer</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleReset}>Try Again</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
