import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Quiz } from '../hooks/useQuizzes';
import { QuestionWithDetails } from '../hooks/useQuestions';
import { invoke } from '@tauri-apps/api/core';
import { NumericInputRenderer } from '../components/questions/renderers/NumericInputRenderer';
import { OrderingRenderer } from '../components/questions/renderers/OrderingRenderer';
import { MatchingRenderer } from '../components/questions/renderers/MatchingRenderer';
import { getImageUrl } from '../utils/images';

interface QuizAnswer {
  questionId: number;
  answer: string | string[] | number[] | Record<number, number>;
}

export default function QuizTakingPage() {
  const { subjectId, topicId, quizId } = useParams<{
    subjectId: string;
    topicId: string;
    quizId: string;
  }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, QuizAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState<number>(Date.now());
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>();
  const [optionImageUrls, setOptionImageUrls] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (quizId) {
      loadQuizAndQuestions(parseInt(quizId));
    }
  }, [quizId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Load image URLs when current question changes
  useEffect(() => {
    const loadImageUrls = async () => {
      if (questions.length === 0) return;

      const currentQuestion = questions[currentQuestionIndex];

      // Load question image
      if (currentQuestion.questionImagePath) {
        const url = await getImageUrl(currentQuestion.questionImagePath);
        setQuestionImageUrl(url);
      } else {
        setQuestionImageUrl(undefined);
      }

      // Load option images
      const urlMap = new Map<number, string>();
      for (const option of currentQuestion.options) {
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
  }, [currentQuestionIndex, questions]);

  const loadQuizAndQuestions = async (quizId: number) => {
    try {
      setLoading(true);

      // Load quiz
      const quizData = await invoke<Quiz>('get_quiz', { id: quizId });
      setQuiz(quizData);

      // Load all questions from topic
      const allQuestions = await invoke<QuestionWithDetails[]>('get_questions', {
        topicId: quizData.topicId,
      });

      // Select and shuffle questions
      let selectedQuestions = [...allQuestions];

      // Shuffle if enabled
      if (quizData.shuffleQuestions) {
        selectedQuestions = shuffleArray(selectedQuestions);
      }

      // Take only the required number
      selectedQuestions = selectedQuestions.slice(0, quizData.questionCount);

      // Shuffle options within each question if enabled
      if (quizData.shuffleOptions) {
        selectedQuestions = selectedQuestions.map((q) => ({
          ...q,
          options: shuffleArray([...q.options]),
        }));
      }

      setQuestions(selectedQuestions);

      // Set timer if time limit exists
      if (quizData.timeLimitMinutes) {
        setTimeRemaining(quizData.timeLimitMinutes * 60);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load quiz:', err);
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAnswer = (questionId: number, answer: string | string[] | number[] | Record<number, number>) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, { questionId, answer });
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Navigate to results page with answers
    const answersArray = Array.from(answers.values());
    navigate(
      `/subjects/${subjectId}/topics/${topicId}/quizzes/${quizId}/results`,
      {
        state: { answers: answersArray, questions, quiz, startTime },
      }
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <MainLayout title="Loading Quiz...">
        <div className="text-center text-text-secondary py-12">
          Loading quiz...
        </div>
      </MainLayout>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <MainLayout title="Quiz Not Found">
        <div className="text-center text-text-secondary py-12">
          Quiz or questions not found
        </div>
      </MainLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <MainLayout
      title={quiz.name}
      breadcrumbs={[
        { label: 'Subjects' },
        { label: 'Quizzes' },
        { label: quiz.name },
      ]}
      showBack={true}
    >
      {/* Timer and Progress */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {timeRemaining !== null && (
          <div className="flex items-center gap-2 text-text-primary">
            <Clock size={18} />
            <span
              className={`font-mono ${
                timeRemaining < 60 ? 'text-accent-red' : ''
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
        {/* Question Text */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">
              {currentQuestion.questionType.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-secondary">
              {currentQuestion.points}{' '}
              {currentQuestion.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <p className="text-lg text-text-primary whitespace-pre-wrap">
            {currentQuestion.questionText}
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
        {(currentQuestion.questionType === 'SINGLE_CHOICE' ||
          currentQuestion.questionType === 'MULTIPLE_CHOICE') && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => {
              const isSelected =
                currentQuestion.questionType === 'SINGLE_CHOICE'
                  ? currentAnswer?.answer === option.id.toString()
                  : Array.isArray(currentAnswer?.answer) &&
                    (currentAnswer.answer as string[]).includes(option.id.toString());

              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-border hover:border-accent-blue/50'
                  }`}
                >
                  <input
                    type={
                      currentQuestion.questionType === 'SINGLE_CHOICE'
                        ? 'radio'
                        : 'checkbox'
                    }
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => {
                      if (currentQuestion.questionType === 'SINGLE_CHOICE') {
                        handleAnswer(currentQuestion.id, option.id.toString());
                      } else {
                        const current = (currentAnswer?.answer as string[]) || [];
                        const updated = isSelected
                          ? current.filter((id) => id !== option.id.toString())
                          : [...current, option.id.toString()];
                        handleAnswer(currentQuestion.id, updated);
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

        {currentQuestion.questionType === 'FILL_BLANK' && (
          <div className="space-y-4">
            {currentQuestion.blanks.map((blank, index) => {
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
                        Array.isArray(currentAnswer?.answer)
                          ? currentAnswer.answer[index] || ''
                          : ''
                      }
                      onChange={(e) => {
                        const current = (currentAnswer?.answer as string[]) || [];
                        const updated = [...current];
                        updated[index] = e.target.value;
                        handleAnswer(currentQuestion.id, updated);
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
                        Array.isArray(currentAnswer?.answer)
                          ? currentAnswer.answer[index] || ''
                          : ''
                      }
                      onChange={(e) => {
                        const current = (currentAnswer?.answer as string[]) || [];
                        const updated = [...current];
                        updated[index] = e.target.value;
                        handleAnswer(currentQuestion.id, updated);
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

        {currentQuestion.questionType === 'NUMERIC_INPUT' && currentQuestion.blanks.length > 0 && (
          <NumericInputRenderer
            questionId={currentQuestion.id}
            unit={currentQuestion.blanks[0].unit}
            value={(currentAnswer?.answer as string) || ''}
            onChange={(value) => handleAnswer(currentQuestion.id, value)}
          />
        )}

        {currentQuestion.questionType === 'ORDERING' && (
          <OrderingRenderer
            questionId={currentQuestion.id}
            items={currentQuestion.orderItems.map(item => ({
              id: item.id,
              text: item.itemText,
              correctPosition: item.correctPosition,
            }))}
            value={(currentAnswer?.answer as number[]) || []}
            onChange={(value) => handleAnswer(currentQuestion.id, value)}
          />
        )}

        {currentQuestion.questionType === 'MATCHING' && (
          <MatchingRenderer
            questionId={currentQuestion.id}
            pairs={currentQuestion.matches.map(match => ({
              id: match.id,
              leftItem: match.leftItem,
              rightItem: match.rightItem,
            }))}
            value={(currentAnswer?.answer as Record<number, number>) || {}}
            onChange={(value) => handleAnswer(currentQuestion.id, value)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </Button>

        <div className="text-sm text-text-secondary">
          {answers.size} / {questions.length} answered
        </div>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(questions.length - 1, prev + 1)
              )
            }
          >
            Next
            <ChevronRight size={20} />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <CheckCircle size={20} />
            Submit Quiz
          </Button>
        )}
      </div>
    </MainLayout>
  );
}
