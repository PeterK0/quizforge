import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, XCircle, Home, Download } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Quiz } from '../hooks/useQuizzes';
import { QuestionWithDetails } from '../hooks/useQuestions';

interface QuizAnswer {
  questionId: number;
  answer: string | string[] | number[] | Record<number, number>;
}

interface LocationState {
  answers: QuizAnswer[];
  questions: QuestionWithDetails[];
  quiz: Quiz;
  startTime: number;
}

interface QuestionResult {
  question: QuestionWithDetails;
  userAnswer: QuizAnswer | undefined;
  isCorrect: boolean;
  pointsEarned: number;
}

export default function QuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId, topicId } = useParams();
  const state = location.state as LocationState | null;

  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const attemptSavedRef = useRef(false);

  useEffect(() => {
    if (!state || !state.questions || !state.quiz) {
      return;
    }

    const { questions, answers } = state;
    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    // Grade each question
    const gradedResults: QuestionResult[] = questions.map((question) => {
      const userAnswer = answersMap.get(question.id);
      const pointsEarned = gradeQuestionWithPartialCredit(question, userAnswer);
      const isCorrect = pointsEarned === question.points;

      return {
        question,
        userAnswer,
        isCorrect,
        pointsEarned,
      };
    });

    setResults(gradedResults);

    // Calculate scores
    const earned = gradedResults.reduce((sum, r) => sum + r.pointsEarned, 0);
    const max = questions.reduce((sum, q) => sum + q.points, 0);
    const pct = max > 0 ? (earned / max) * 100 : 0;

    setTotalScore(earned);
    setMaxScore(max);
    setPercentage(Math.round(pct));

    // Save quiz attempt (only once using ref to avoid re-renders)
    if (!attemptSavedRef.current) {
      attemptSavedRef.current = true;
      const timeTaken = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
      invoke('save_quiz_attempt', {
        data: {
          quizId: state.quiz.id,
          score: earned,
          maxScore: max,
          percentage: pct,
          timeTakenSeconds: timeTaken,
        },
      }).catch((err) => console.error('Failed to save quiz attempt:', err));
    }
  }, [state]);

  const gradeQuestionWithPartialCredit = (
    question: QuestionWithDetails,
    userAnswer: QuizAnswer | undefined
  ): number => {
    if (!userAnswer) return 0;

    if (
      question.questionType === 'SINGLE_CHOICE' ||
      question.questionType === 'MULTIPLE_CHOICE'
    ) {
      const correctOptionIds = question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id.toString())
        .sort();

      const userAnswerArray = Array.isArray(userAnswer.answer)
        ? userAnswer.answer.sort()
        : [userAnswer.answer];

      const isFullyCorrect = (
        correctOptionIds.length === userAnswerArray.length &&
        correctOptionIds.every((id, idx) => id === userAnswerArray[idx])
      );

      return isFullyCorrect ? question.points : 0;
    }

    if (question.questionType === 'FILL_BLANK') {
      const userAnswers = Array.isArray(userAnswer.answer)
        ? userAnswer.answer
        : [userAnswer.answer];

      const totalBlanks = question.blanks.length;
      if (totalBlanks === 0) return 0;

      const pointsPerBlank = question.points / totalBlanks;
      let earnedPoints = 0;

      question.blanks.forEach((blank, index) => {
        const answer = userAnswers[index];
        if (typeof answer !== 'string') return;
        const userAns = answer.trim().toLowerCase();
        if (!userAns) return;

        const correctAns = blank.correctAnswer.trim().toLowerCase();
        let isCorrect = false;

        // Check exact match
        if (userAns === correctAns) {
          isCorrect = true;
        }
        // Check acceptable answers
        else if (blank.acceptableAnswers) {
          const acceptable = blank.acceptableAnswers
            .split(',')
            .map((a) => a.trim().toLowerCase());
          if (acceptable.includes(userAns)) {
            isCorrect = true;
          }
        }
        // Check numeric tolerance
        else if (blank.isNumeric && blank.numericTolerance !== undefined) {
          const userNum = parseFloat(userAns);
          const correctNum = parseFloat(correctAns);
          if (
            !isNaN(userNum) &&
            !isNaN(correctNum) &&
            Math.abs(userNum - correctNum) <= blank.numericTolerance
          ) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          earnedPoints += pointsPerBlank;
        }
      });

      return Math.round(earnedPoints * 100) / 100; // Round to 2 decimal places
    }

    if (question.questionType === 'NUMERIC_INPUT') {
      if (!question.blanks || question.blanks.length === 0) return 0;

      const blank = question.blanks[0];
      const userAns = typeof userAnswer.answer === 'string' ? userAnswer.answer.trim() : '';
      if (!userAns) return 0;

      const userNum = parseFloat(userAns);
      const correctNum = parseFloat(blank.correctAnswer);
      const tolerance = blank.numericTolerance || 0.1;

      const isCorrect = (
        !isNaN(userNum) &&
        !isNaN(correctNum) &&
        Math.abs(userNum - correctNum) <= tolerance
      );

      return isCorrect ? question.points : 0;
    }

    if (question.questionType === 'ORDERING') {
      const userOrder = Array.isArray(userAnswer.answer) ? userAnswer.answer : [];
      if (userOrder.length !== question.orderItems.length) return 0;

      // Give partial credit for each correctly positioned item
      const totalItems = question.orderItems.length;
      const pointsPerItem = question.points / totalItems;
      let earnedPoints = 0;

      question.orderItems.forEach((_, index) => {
        const userItemId = userOrder[index];
        const itemAtPosition = question.orderItems.find(i => i.id === userItemId);
        if (itemAtPosition && itemAtPosition.correctPosition === index + 1) {
          earnedPoints += pointsPerItem;
        }
      });

      return Math.round(earnedPoints * 100) / 100;
    }

    if (question.questionType === 'MATCHING') {
      const userMatches = typeof userAnswer.answer === 'object' && !Array.isArray(userAnswer.answer)
        ? userAnswer.answer as Record<number, number>
        : {};

      // Give partial credit for each correct match
      const totalPairs = question.matches.length;
      const pointsPerPair = question.points / totalPairs;
      let earnedPoints = 0;

      question.matches.forEach((match) => {
        const leftItemId = match.id;
        const userRightId = userMatches[leftItemId];
        // Check if the user matched this left item to the correct right item
        if (userRightId === match.id) {
          earnedPoints += pointsPerPair;
        }
      });

      return Math.round(earnedPoints * 100) / 100;
    }

    return 0;
  };

  const renderDetailedAnswerReview = (result: QuestionResult) => {
    const { question, userAnswer } = result;

    // Single Choice / Multiple Choice
    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
      const userAnswerArray = Array.isArray(userAnswer?.answer) ? userAnswer.answer : userAnswer?.answer ? [userAnswer.answer] : [];
      const correctOptionIds = question.options.filter(opt => opt.isCorrect).map(opt => opt.id.toString());

      return (
        <div className="p-3 bg-bg-tertiary rounded-lg space-y-2">
          <p className="text-sm font-medium text-text-secondary mb-2">Answer Review:</p>
          {question.options.map((opt) => {
            const isUserAnswer = (userAnswerArray as string[]).includes(opt.id.toString());
            const isCorrectOption = correctOptionIds.includes(opt.id.toString());
            const isCorrect = isUserAnswer === isCorrectOption;

            return (
              <div
                key={opt.id}
                className="flex items-center gap-2 p-2 rounded"
                style={{
                  backgroundColor: isCorrectOption ? 'var(--color-accent-green)/10' : 'transparent',
                  border: isUserAnswer ? '2px solid' : '1px solid',
                  borderColor: isCorrect
                    ? 'var(--color-accent-green)'
                    : isUserAnswer
                    ? 'var(--color-accent-red)'
                    : 'var(--color-border)',
                }}
              >
                {isUserAnswer && (
                  isCorrect ? (
                    <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
                  )
                )}
                {!isUserAnswer && isCorrectOption && (
                  <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
                )}
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.optionText}
                  {isUserAnswer && ' (Your answer)'}
                  {!isUserAnswer && isCorrectOption && ' (Correct answer)'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // Fill in the Blank
    if (question.questionType === 'FILL_BLANK') {
      const userAnswers = Array.isArray(userAnswer?.answer) ? userAnswer.answer : [];

      return (
        <div className="p-3 bg-bg-tertiary rounded-lg space-y-3">
          <p className="text-sm font-medium text-text-secondary mb-2">Answer Review ({result.pointsEarned} / {question.points} points):</p>
          {question.blanks.map((blank, index) => {
            const userAns = typeof userAnswers[index] === 'string' ? userAnswers[index].trim() : '';
            const correctAns = blank.correctAnswer.trim();

            let isCorrect = false;
            if (userAns.toLowerCase() === correctAns.toLowerCase()) {
              isCorrect = true;
            } else if (blank.acceptableAnswers) {
              const acceptable = blank.acceptableAnswers.split(',').map(a => a.trim().toLowerCase());
              if (acceptable.includes(userAns.toLowerCase())) {
                isCorrect = true;
              }
            } else if (blank.isNumeric && blank.numericTolerance !== undefined) {
              const userNum = parseFloat(userAns);
              const correctNum = parseFloat(correctAns);
              if (!isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) <= blank.numericTolerance) {
                isCorrect = true;
              }
            }

            return (
              <div
                key={index}
                className="p-2 rounded border"
                style={{
                  borderColor: isCorrect ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                  backgroundColor: isCorrect ? 'var(--color-accent-green)/10' : 'var(--color-accent-red)/10',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isCorrect ? (
                    <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Blank {index + 1}
                  </span>
                </div>
                <div className="ml-6 text-sm">
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Your answer: <span style={{ color: 'var(--color-text-primary)' }}>{userAns || '(empty)'}</span>
                  </p>
                  {!isCorrect && (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      Correct answer: <span style={{ color: 'var(--color-accent-green)' }}>{correctAns}</span>
                      {blank.acceptableAnswers && ` (or: ${blank.acceptableAnswers})`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Numeric Input
    if (question.questionType === 'NUMERIC_INPUT') {
      const userAns = typeof userAnswer?.answer === 'string' ? userAnswer.answer.trim() : '';
      const blank = question.blanks?.[0];
      const correctAns = blank?.correctAnswer || '';
      const tolerance = blank?.numericTolerance || 0.1;

      const userNum = parseFloat(userAns);
      const correctNum = parseFloat(correctAns);
      const isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) <= tolerance;

      return (
        <div
          className="p-3 rounded border"
          style={{
            backgroundColor: isCorrect ? 'var(--color-accent-green)/10' : 'var(--color-accent-red)/10',
            borderColor: isCorrect ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
            ) : (
              <XCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Answer Review
            </span>
          </div>
          <div className="ml-6 text-sm">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Your answer: <span style={{ color: 'var(--color-text-primary)' }}>{userAns || '(empty)'}</span>
            </p>
            {!isCorrect && (
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Correct answer: <span style={{ color: 'var(--color-accent-green)' }}>{correctAns}</span>
                {blank?.unit && ` ${blank.unit}`}
                {tolerance && ` (±${tolerance})`}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Ordering
    if (question.questionType === 'ORDERING') {
      const userOrder = Array.isArray(userAnswer?.answer) ? userAnswer.answer : [];
      const correctOrder = [...question.orderItems].sort((a, b) => a.correctPosition - b.correctPosition);

      return (
        <div className="p-3 bg-bg-tertiary rounded-lg space-y-3">
          <p className="text-sm font-medium text-text-secondary">
            Answer Review ({result.pointsEarned} / {question.points} points):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Your Answer */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Your Answer:
              </p>
              <div className="space-y-2">
                {userOrder.map((itemId, index) => {
                  const item = question.orderItems.find(i => i.id === itemId);
                  const isCorrect = item && item.correctPosition === index + 1;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded border"
                      style={{
                        borderColor: isCorrect ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                        backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{
                          backgroundColor: isCorrect ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                          color: 'white',
                        }}
                      >
                        {index + 1}
                      </div>
                      {isCorrect ? (
                        <CheckCircle size={16} style={{ color: 'var(--color-accent-green)', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={16} style={{ color: 'var(--color-accent-red)', flexShrink: 0 }} />
                      )}
                      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {item?.itemText || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Correct Order */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Correct Order:
              </p>
              <div className="space-y-2">
                {correctOrder.map((item, index) => {
                  const userItemAtPosition = userOrder[index];
                  const isCorrect = userItemAtPosition === item.id;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded border"
                      style={{
                        borderColor: 'var(--color-accent-green)',
                        backgroundColor: 'rgba(34, 197, 94, 0.05)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--color-accent-green)',
                          color: 'white',
                        }}
                      >
                        {index + 1}
                      </div>
                      {isCorrect ? (
                        <CheckCircle size={16} style={{ color: 'var(--color-accent-green)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 16, flexShrink: 0 }} />
                      )}
                      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {item.itemText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Matching
    if (question.questionType === 'MATCHING') {
      const userMatches = typeof userAnswer?.answer === 'object' && !Array.isArray(userAnswer.answer)
        ? userAnswer.answer as Record<number, number>
        : {};

      return (
        <div className="p-3 bg-bg-tertiary rounded-lg space-y-2">
          <p className="text-sm font-medium text-text-secondary mb-2">
            Answer Review ({result.pointsEarned} / {question.points} points):
          </p>
          <div className="space-y-2">
            {question.matches.map((match) => {
              const userRightId = userMatches[match.id];
              const isCorrect = userRightId === match.id;
              const userMatchedPair = question.matches.find(m => m.id === userRightId);

              return (
                <div
                  key={match.id}
                  className="p-2 rounded border"
                  style={{
                    borderColor: isCorrect ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                    backgroundColor: isCorrect ? 'var(--color-accent-green)/10' : 'var(--color-accent-red)/10',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isCorrect ? (
                      <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
                    ) : (
                      <XCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {match.leftItem}
                    </span>
                  </div>
                  <div className="ml-6 text-sm">
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      Your match: <span style={{ color: 'var(--color-text-primary)' }}>
                        {userMatchedPair?.rightItem || '(not matched)'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        Correct match: <span style={{ color: 'var(--color-accent-green)' }}>
                          {match.rightItem}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!state || !state.quiz) {
    return (
      <MainLayout title="Quiz Results">
        <div className="text-center text-text-secondary py-12">
          No quiz results found. Please take a quiz first.
        </div>
      </MainLayout>
    );
  }

  const { quiz } = state;
  const passed = percentage >= quiz.passingScorePercent;

  const exportResults = () => {
    const date = new Date().toLocaleString();
    let content = `Quiz Results - ${quiz.name}\n`;
    content += `Date: ${date}\n`;
    content += `Score: ${totalScore}/${maxScore} (${percentage}%)\n`;
    content += `Status: ${passed ? 'PASSED' : 'FAILED'}\n`;
    content += `Passing Score: ${quiz.passingScorePercent}%\n\n`;
    content += `Question Breakdown:\n`;
    content += `${'='.repeat(60)}\n\n`;

    results.forEach((result, index) => {
      content += `Q${index + 1}. ${result.question.questionText}\n`;
      content += `   Difficulty: ${result.question.difficulty}\n`;
      content += `   Points: ${result.pointsEarned}/${result.question.points}\n`;
      content += `   Result: ${result.isCorrect ? '✓ Correct' : '✗ Incorrect'}\n`;

      if (result.question.questionType === 'SINGLE_CHOICE' || result.question.questionType === 'MULTIPLE_CHOICE') {
        const correctOptions = result.question.options.filter(o => o.isCorrect).map(o => o.optionText);
        content += `   Correct Answer(s): ${correctOptions.join(', ')}\n`;
      }

      if (result.question.explanation) {
        content += `   Explanation: ${result.question.explanation}\n`;
      }
      content += `\n`;
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quiz.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Quiz Results"
      breadcrumbs={[
        { label: 'Subjects' },
        { label: 'Quizzes' },
        { label: quiz.name },
        { label: 'Results' },
      ]}
      action={
        <Button variant="secondary" onClick={exportResults}>
          <Download size={20} className="inline mr-2" />
          Export Results
        </Button>
      }
    >
      {/* Score Summary */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {quiz.name}
            </h2>
            <p className="text-text-secondary">Quiz completed!</p>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              passed
                ? 'bg-accent-green/20 border-2 border-accent-green'
                : 'bg-accent-red/20 border-2 border-accent-red'
            }`}
          >
            <div
              className={`text-4xl font-bold mb-1 ${
                passed ? 'text-accent-green' : 'text-accent-red'
              }`}
            >
              {percentage}%
            </div>
            <div className={passed ? 'text-accent-green' : 'text-accent-red'}>
              {passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-bg-tertiary rounded-lg">
            <div className="text-2xl font-bold text-text-primary mb-1">
              {totalScore} / {maxScore}
            </div>
            <div className="text-sm text-text-secondary">Score</div>
          </div>

          <div className="text-center p-4 bg-bg-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent-green mb-1">
              {results.filter((r) => r.isCorrect).length}
            </div>
            <div className="text-sm text-text-secondary">Correct</div>
          </div>

          <div className="text-center p-4 bg-bg-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent-red mb-1">
              {results.filter((r) => !r.isCorrect).length}
            </div>
            <div className="text-sm text-text-secondary">Incorrect</div>
          </div>
        </div>

        {!passed && (
          <div className="mt-4 p-4 bg-accent-yellow/20 border border-accent-yellow rounded-lg text-accent-yellow text-sm">
            Passing score: {quiz.passingScorePercent}% - You need to score at least{' '}
            {quiz.passingScorePercent}% to pass this quiz.
          </div>
        )}
      </div>

      {/* Question Review */}
      {quiz.showAnswersAfter !== 'NEVER' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Question Review
          </h3>

          {results.map((result, index) => (
            <div
              key={result.question.id}
              className={`bg-bg-secondary border-2 rounded-lg p-4 ${
                result.isCorrect
                  ? 'border-accent-green'
                  : 'border-accent-red'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">
                      Question {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
                      {result.question.questionType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-text-primary">
                    {result.question.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {result.isCorrect ? (
                    <CheckCircle size={24} className="text-accent-green" />
                  ) : (
                    <XCircle size={24} className="text-accent-red" />
                  )}
                  <span className="text-sm text-text-secondary">
                    {result.pointsEarned} / {result.question.points}
                  </span>
                </div>
              </div>

              {/* Detailed Answer Review */}
              <div className="mt-3">
                {renderDetailedAnswerReview(result)}
              </div>

              {/* Explanation */}
              {result.question.explanation && (
                <div className="mt-3 p-3 bg-accent-blue/10 rounded-lg border border-accent-blue">
                  <p className="text-sm font-medium text-accent-blue mb-1">
                    Explanation:
                  </p>
                  <p className="text-sm text-text-primary">
                    {result.question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-3 justify-center">
        <Button
          variant="secondary"
          onClick={() => navigate(`/subjects/${subjectId}/topics/${topicId}/quizzes`)}
        >
          <Home size={20} />
          Back to Quizzes
        </Button>
        <Button
          onClick={() =>
            navigate(
              `/subjects/${subjectId}/topics/${topicId}/quizzes/${quiz.id}/take`
            )
          }
        >
          Retake Quiz
        </Button>
      </div>
    </MainLayout>
  );
}
