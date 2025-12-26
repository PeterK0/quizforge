import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <BookOpen size={64} style={{ color: 'var(--color-accent-blue)' }} />
        </div>
        <h1 className="text-4xl font-bold mb-4">Welcome to QuizForge</h1>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Academic Quiz Management System
        </p>
        <div className="mt-8">
          <button className="btn-primary" onClick={() => navigate('/subjects')}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
