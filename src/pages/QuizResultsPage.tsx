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
      const isCorrect = gradeQuestion(question, userAnswer);
      const pointsEarned = isCorrect ? question.points : 0;

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

  const gradeQuestion = (
    question: QuestionWithDetails,
    userAnswer: QuizAnswer | undefined
  ): boolean => {
    if (!userAnswer) return false;

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

      return (
        correctOptionIds.length === userAnswerArray.length &&
        correctOptionIds.every((id, idx) => id === userAnswerArray[idx])
      );
    }

    if (question.questionType === 'FILL_BLANK') {
      const userAnswers = Array.isArray(userAnswer.answer)
        ? userAnswer.answer
        : [userAnswer.answer];

      return question.blanks.every((blank, index) => {
        const answer = userAnswers[index];
        if (typeof answer !== 'string') return false;
        const userAns = answer.trim().toLowerCase();
        if (!userAns) return false;

        const correctAns = blank.correctAnswer.trim().toLowerCase();

        // Check exact match
        if (userAns === correctAns) return true;

        // Check acceptable answers
        if (blank.acceptableAnswers) {
          const acceptable = blank.acceptableAnswers
            .split(',')
            .map((a) => a.trim().toLowerCase());
          if (acceptable.includes(userAns)) return true;
        }

        // Check numeric tolerance
        if (blank.isNumeric && blank.numericTolerance !== undefined) {
          const userNum = parseFloat(userAns);
          const correctNum = parseFloat(correctAns);
          if (
            !isNaN(userNum) &&
            !isNaN(correctNum) &&
            Math.abs(userNum - correctNum) <= blank.numericTolerance
          ) {
            return true;
          }
        }

        return false;
      });
    }

    if (question.questionType === 'NUMERIC_INPUT') {
      if (!question.blanks || question.blanks.length === 0) return false;

      const blank = question.blanks[0];
      const userAns = typeof userAnswer.answer === 'string' ? userAnswer.answer.trim() : '';
      if (!userAns) return false;

      const userNum = parseFloat(userAns);
      const correctNum = parseFloat(blank.correctAnswer);
      const tolerance = blank.numericTolerance || 0.1;

      return (
        !isNaN(userNum) &&
        !isNaN(correctNum) &&
        Math.abs(userNum - correctNum) <= tolerance
      );
    }

    if (question.questionType === 'ORDERING') {
      const userOrder = Array.isArray(userAnswer.answer) ? userAnswer.answer : [];
      if (userOrder.length !== question.orderItems.length) return false;

      // Check if the order matches the correct positions
      return question.orderItems.every((_, index) => {
        const userItemId = userOrder[index];
        const itemAtPosition = question.orderItems.find(i => i.id === userItemId);
        return itemAtPosition && itemAtPosition.correctPosition === index + 1;
      });
    }

    if (question.questionType === 'MATCHING') {
      const userMatches = typeof userAnswer.answer === 'object' && !Array.isArray(userAnswer.answer)
        ? userAnswer.answer as Record<number, number>
        : {};

      // Check if all pairs are matched correctly
      return question.matches.every((match) => {
        // Find which left item should match this pair
        const leftItemId = match.id;
        const userRightId = userMatches[leftItemId];
        // The correct right ID is the same as match.id since they're pairs
        // Actually, we need to match leftItem to rightItem correctly
        // The user maps left item ID to right item ID
        // We need to check if the mapping is correct
        const matchedPair = question.matches.find(m => m.id === userRightId);
        return matchedPair && matchedPair.leftItem === match.leftItem && matchedPair.rightItem === match.rightItem;
      });
    }

    return false;
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

              {/* Show correct answer if question was wrong */}
              {!result.isCorrect && result.question.options.length > 0 && (
                <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-sm text-accent-green mb-2">
                    Correct answer:
                  </p>
                  {result.question.options
                    .filter((opt) => opt.isCorrect)
                    .map((opt) => (
                      <div key={opt.id} className="text-sm text-text-primary">
                        • {opt.optionText}
                      </div>
                    ))}
                </div>
              )}

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
