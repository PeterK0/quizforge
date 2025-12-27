-- QuizForge Database Schema (SQLite)

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    week_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Questions table (Question Bank)
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    question_type TEXT NOT NULL CHECK (
        question_type IN (
            'SINGLE_CHOICE',
            'MULTIPLE_CHOICE',
            'FILL_BLANK',
            'FILL_BLANK_MULTIPLE',
            'NUMERIC_INPUT',
            'MATCHING',
            'ORDERING',
            'IMAGE_IDENTIFICATION',
            'CALCULATION'
        )
    ),
    question_text TEXT NOT NULL,
    question_image_path TEXT,
    explanation TEXT,
    difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    points INTEGER DEFAULT 1,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Answer options for choice-based questions
CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_image_path TEXT,
    is_correct INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- For FILL_BLANK questions - stores blank positions and answers
CREATE TABLE IF NOT EXISTS question_blanks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    blank_index INTEGER NOT NULL,
    correct_answer TEXT NOT NULL,
    acceptable_answers TEXT,
    is_numeric INTEGER DEFAULT 0,
    numeric_tolerance REAL,
    unit TEXT,
    input_type TEXT DEFAULT 'INPUT' CHECK (input_type IN ('INPUT', 'DROPDOWN')),
    dropdown_options TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- For MATCHING questions - left and right items
CREATE TABLE IF NOT EXISTS question_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    left_item TEXT NOT NULL,
    right_item TEXT NOT NULL,
    left_image_path TEXT,
    right_image_path TEXT,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- For ORDERING questions - items to be ordered
CREATE TABLE IF NOT EXISTS question_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    correct_position INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    question_count INTEGER NOT NULL,
    time_limit_minutes INTEGER,
    shuffle_questions INTEGER DEFAULT 1,
    shuffle_options INTEGER DEFAULT 1,
    show_answers_after TEXT DEFAULT 'END_OF_QUIZ' CHECK (
        show_answers_after IN ('EACH_QUESTION', 'END_OF_QUIZ', 'NEVER')
    ),
    passing_score_percent INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Quiz attempts (history)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    score INTEGER,
    max_score INTEGER,
    percentage REAL,
    time_taken_seconds INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Individual question responses in an attempt
CREATE TABLE IF NOT EXISTS attempt_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    response_data TEXT NOT NULL,
    is_correct INTEGER,
    points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Exams table (subject-level quizzes that can pull from multiple topics)
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_question_count INTEGER NOT NULL,
    time_limit_minutes INTEGER,
    shuffle_questions INTEGER DEFAULT 1,
    shuffle_options INTEGER DEFAULT 1,
    show_answers_after TEXT DEFAULT 'END_OF_QUIZ' CHECK (
        show_answers_after IN ('EACH_QUESTION', 'END_OF_QUIZ', 'NEVER')
    ),
    passing_score_percent INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Exam topics (which topics are included and how many questions from each)
CREATE TABLE IF NOT EXISTS exam_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    question_count INTEGER NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Exam attempts (history)
CREATE TABLE IF NOT EXISTS exam_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    score INTEGER,
    max_score INTEGER,
    percentage REAL,
    time_taken_seconds INTEGER,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Individual question responses in an exam attempt
CREATE TABLE IF NOT EXISTS exam_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    response_data TEXT NOT NULL,
    is_correct INTEGER,
    points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON attempt_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON attempt_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_exam ON exam_topics(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_topic ON exam_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_attempt ON exam_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_question ON exam_responses(question_id);
