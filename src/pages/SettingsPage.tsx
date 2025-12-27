import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Save, Image as ImageIcon } from 'lucide-react';

interface QuizDefaults {
  questionCount: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
}

interface ExamDefaults {
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: 'EACH_QUESTION' | 'END_OF_QUIZ' | 'NEVER';
  passingScorePercent: number;
}

const DEFAULT_QUIZ_SETTINGS: QuizDefaults = {
  questionCount: 10,
  timeLimitMinutes: null,
  shuffleQuestions: true,
  shuffleOptions: true,
  showAnswersAfter: 'END_OF_QUIZ',
  passingScorePercent: 70,
};

const DEFAULT_EXAM_SETTINGS: ExamDefaults = {
  timeLimitMinutes: null,
  shuffleQuestions: true,
  shuffleOptions: true,
  showAnswersAfter: 'END_OF_QUIZ',
  passingScorePercent: 70,
};

export default function SettingsPage() {
  const [quizDefaults, setQuizDefaults] = useState<QuizDefaults>(DEFAULT_QUIZ_SETTINGS);
  const [examDefaults, setExamDefaults] = useState<ExamDefaults>(DEFAULT_EXAM_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedQuizDefaults = localStorage.getItem('quizDefaults');
    const savedExamDefaults = localStorage.getItem('examDefaults');

    if (savedQuizDefaults) {
      setQuizDefaults(JSON.parse(savedQuizDefaults));
    }
    if (savedExamDefaults) {
      setExamDefaults(JSON.parse(savedExamDefaults));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('quizDefaults', JSON.stringify(quizDefaults));
    localStorage.setItem('examDefaults', JSON.stringify(examDefaults));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <MainLayout
      title="Settings"
      breadcrumbs={[{ label: 'Settings' }]}
      action={
        <Button onClick={saveSettings}>
          <Save size={20} className="inline mr-2" />
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      }
    >
      <div className="max-w-4xl space-y-8">
        {/* Quiz Defaults */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Quiz Default Template
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            These settings will be used as defaults when creating new quizzes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Count */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Default Question Count
              </label>
              <input
                type="number"
                min="1"
                value={quizDefaults.questionCount}
                onChange={(e) => setQuizDefaults({ ...quizDefaults, questionCount: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Time Limit (minutes, 0 = no limit)
              </label>
              <input
                type="number"
                min="0"
                value={quizDefaults.timeLimitMinutes || 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuizDefaults({ ...quizDefaults, timeLimitMinutes: val === 0 ? null : val });
                }}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizDefaults.passingScorePercent}
                onChange={(e) => setQuizDefaults({ ...quizDefaults, passingScorePercent: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Show Answers After */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Show Answers
              </label>
              <select
                value={quizDefaults.showAnswersAfter}
                onChange={(e) => setQuizDefaults({ ...quizDefaults, showAnswersAfter: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="EACH_QUESTION">After Each Question</option>
                <option value="END_OF_QUIZ">At End of Quiz</option>
                <option value="NEVER">Never</option>
              </select>
            </div>

            {/* Shuffle Questions */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="quiz-shuffle-questions"
                checked={quizDefaults.shuffleQuestions}
                onChange={(e) => setQuizDefaults({ ...quizDefaults, shuffleQuestions: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="quiz-shuffle-questions" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shuffle Questions
              </label>
            </div>

            {/* Shuffle Options */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="quiz-shuffle-options"
                checked={quizDefaults.shuffleOptions}
                onChange={(e) => setQuizDefaults({ ...quizDefaults, shuffleOptions: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="quiz-shuffle-options" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shuffle Options
              </label>
            </div>
          </div>
        </div>

        {/* Exam Defaults */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Exam Default Template
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            These settings will be used as defaults when creating new exams.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Time Limit (minutes, 0 = no limit)
              </label>
              <input
                type="number"
                min="0"
                value={examDefaults.timeLimitMinutes || 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setExamDefaults({ ...examDefaults, timeLimitMinutes: val === 0 ? null : val });
                }}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={examDefaults.passingScorePercent}
                onChange={(e) => setExamDefaults({ ...examDefaults, passingScorePercent: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Show Answers After */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Show Answers
              </label>
              <select
                value={examDefaults.showAnswersAfter}
                onChange={(e) => setExamDefaults({ ...examDefaults, showAnswersAfter: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="EACH_QUESTION">After Each Question</option>
                <option value="END_OF_QUIZ">At End of Exam</option>
                <option value="NEVER">Never</option>
              </select>
            </div>

            <div></div>

            {/* Shuffle Questions */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="exam-shuffle-questions"
                checked={examDefaults.shuffleQuestions}
                onChange={(e) => setExamDefaults({ ...examDefaults, shuffleQuestions: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="exam-shuffle-questions" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shuffle Questions
              </label>
            </div>

            {/* Shuffle Options */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="exam-shuffle-options"
                checked={examDefaults.shuffleOptions}
                onChange={(e) => setExamDefaults({ ...examDefaults, shuffleOptions: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="exam-shuffle-options" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shuffle Options
              </label>
            </div>
          </div>
        </div>

        {/* Image Management Section */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <ImageIcon size={24} />
            Image Management
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            View and manage all images used in questions and answers.
          </p>
          <Button variant="secondary">
            View Image Library
          </Button>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Coming soon: Browse all images, see which questions use them, and manage unused images.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

// Export these functions so other components can access the defaults
export function getQuizDefaults(): QuizDefaults {
  const saved = localStorage.getItem('quizDefaults');
  return saved ? JSON.parse(saved) : DEFAULT_QUIZ_SETTINGS;
}

export function getExamDefaults(): ExamDefaults {
  const saved = localStorage.getItem('examDefaults');
  return saved ? JSON.parse(saved) : DEFAULT_EXAM_SETTINGS;
}
