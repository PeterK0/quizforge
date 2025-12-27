import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SubjectPage from './pages/SubjectPage';
import TopicPage from './pages/TopicPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizManagementPage from './pages/QuizManagementPage';
import QuizTakingPage from './pages/QuizTakingPage';
import QuizResultsPage from './pages/QuizResultsPage';
import QuizzesPage from './pages/QuizzesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExamsPage from './pages/ExamsPage';
import AllExamsPage from './pages/AllExamsPage';
import ExamTakingPage from './pages/ExamTakingPage';
import ExamResultsPage from './pages/ExamResultsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/subjects" replace />} />
          <Route path="/subjects" element={<SubjectPage />} />
          <Route path="/subjects/:subjectId/topics" element={<TopicPage />} />
          <Route path="/subjects/:subjectId/topics/:topicId/questions" element={<QuestionBankPage />} />
          <Route path="/subjects/:subjectId/topics/:topicId/quizzes" element={<QuizManagementPage />} />
          <Route path="/subjects/:subjectId/topics/:topicId/quizzes/:quizId/take" element={<QuizTakingPage />} />
          <Route path="/subjects/:subjectId/topics/:topicId/quizzes/:quizId/results" element={<QuizResultsPage />} />
          <Route path="/subjects/:subjectId/exams" element={<ExamsPage />} />
          <Route path="/subjects/:subjectId/exams/:examId/take" element={<ExamTakingPage />} />
          <Route path="/subjects/:subjectId/exams/:examId/results" element={<ExamResultsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/exams" element={<AllExamsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
