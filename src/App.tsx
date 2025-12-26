import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SubjectPage from './pages/SubjectPage';
import TopicPage from './pages/TopicPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizManagementPage from './pages/QuizManagementPage';
import QuizTakingPage from './pages/QuizTakingPage';
import QuizResultsPage from './pages/QuizResultsPage';
import QuizzesPage from './pages/QuizzesPage';
import AnalyticsPage from './pages/AnalyticsPage';

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
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
