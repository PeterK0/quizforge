import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MainLayout } from '../components/layout/MainLayout';
import { TrendingUp, TrendingDown, Minus, Clock, Award, Target, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface QuizAttempt {
  id: number;
  quizId: number;
  quizName: string;
  topicName: string;
  subjectName: string;
  startedAt: string;
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenSeconds: number;
  passed: boolean;
}

interface TopicPerformance {
  topicName: string;
  subjectName: string;
  attempts: number;
  averageScore: number;
  passRate: number;
}

export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attemptsData, topicData] = await Promise.all([
        invoke<QuizAttempt[]>('get_all_quiz_attempts'),
        invoke<TopicPerformance[]>('get_topic_performance').catch(() => []),
      ]);
      setAttempts(attemptsData);
      setTopicPerformance(topicData);
      setError(null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0,
        trend: 'neutral' as const,
      };
    }

    const totalAttempts = attempts.length;
    const averageScore = attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts;
    const passRate = (attempts.filter(a => a.passed).length / totalAttempts) * 100;
    const averageTime = attempts.reduce((sum, a) => sum + a.timeTakenSeconds, 0) / totalAttempts;

    // Calculate trend (compare last 5 to previous 5)
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (attempts.length >= 10) {
      const recent = attempts.slice(0, 5);
      const previous = attempts.slice(5, 10);
      const recentAvg = recent.reduce((sum, a) => sum + a.percentage, 0) / 5;
      const previousAvg = previous.reduce((sum, a) => sum + a.percentage, 0) / 5;

      if (recentAvg > previousAvg + 5) trend = 'up';
      else if (recentAvg < previousAvg - 5) trend = 'down';
    }

    return { totalAttempts, averageScore, passRate, averageTime, trend };
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const stats = calculateStats();

  // Prepare chart data (last 10 attempts)
  const chartData = attempts.slice(0, 10).reverse().map((attempt, index) => ({
    name: `#${attempts.length - index}`,
    score: attempt.percentage,
    date: new Date(attempt.completedAt).toLocaleDateString(),
  }));

  if (loading) {
    return (
      <MainLayout title="Analytics & History">
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading analytics...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Analytics & History"
      breadcrumbs={[{ label: 'Analytics' }]}
    >
      {error && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-accent-red)', color: 'white' }}>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Attempts</span>
            <Target size={20} style={{ color: 'var(--color-accent-blue)' }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {stats.totalAttempts}
          </p>
        </div>

        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Average Score</span>
            <Award size={20} style={{ color: 'var(--color-accent-green)' }} />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats.averageScore.toFixed(1)}%
            </p>
            {stats.trend === 'up' && <TrendingUp size={24} style={{ color: 'var(--color-accent-green)' }} />}
            {stats.trend === 'down' && <TrendingDown size={24} style={{ color: 'var(--color-accent-red)' }} />}
            {stats.trend === 'neutral' && <Minus size={24} style={{ color: 'var(--color-text-secondary)' }} />}
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pass Rate</span>
            <Award size={20} style={{ color: 'var(--color-accent-yellow)' }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {stats.passRate.toFixed(0)}%
          </p>
        </div>

        <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Avg Time</span>
            <Clock size={20} style={{ color: 'var(--color-accent-blue)' }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDuration(Math.round(stats.averageTime))}
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      {attempts.length > 0 && (
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Performance Trend (Last 10 Attempts)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-accent-blue)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent-blue)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Topic Performance Breakdown */}
      {topicPerformance.length > 0 && (
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Performance by Topic
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="topicName"
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                domain={[0, 100]}
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="averageScore"
                fill="var(--color-accent-green)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Topic Stats Table */}
          <div className="mt-6 space-y-2">
            {topicPerformance.map((topic, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={20} style={{ color: 'var(--color-accent-blue)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {topic.topicName}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {topic.subjectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {topic.averageScore.toFixed(1)}%
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Avg Score</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {topic.passRate.toFixed(0)}%
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Pass Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {topic.attempts}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Attempts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attempts History */}
      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Quiz History
        </h2>

        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              No quiz attempts yet
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Complete some quizzes to see your performance history
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 rounded-lg border"
                style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {attempt.quizName}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {attempt.subjectName} › {attempt.topicName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(attempt.completedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{
                        color: attempt.passed ? 'var(--color-accent-green)' : 'var(--color-accent-red)'
                      }}>
                        {attempt.percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {attempt.score}/{attempt.maxScore} points
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {formatDuration(attempt.timeTakenSeconds)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
