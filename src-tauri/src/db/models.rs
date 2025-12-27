use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Subject {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Topic {
    pub id: i64,
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub week_number: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Question {
    pub id: i64,
    pub subject_id: i64,
    pub topic_id: i64,
    pub question_type: String,
    pub question_text: String,
    pub question_image_path: Option<String>,
    pub explanation: Option<String>,
    pub difficulty: String,
    pub points: i32,
    pub source: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Quiz {
    pub id: i64,
    pub topic_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct QuizAttempt {
    pub id: i64,
    pub quiz_id: i64,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub score: Option<i32>,
    pub max_score: Option<i32>,
    pub percentage: Option<f64>,
    pub time_taken_seconds: Option<i32>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Exam {
    pub id: i64,
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub total_question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct ExamTopic {
    pub id: i64,
    pub exam_id: i64,
    pub topic_id: i64,
    pub question_count: i32,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct ExamWithTopics {
    pub id: i64,
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub total_question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
    pub created_at: String,
    pub updated_at: String,
    pub topics: Vec<ExamTopic>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct ExamAttempt {
    pub id: i64,
    pub exam_id: i64,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub score: Option<i32>,
    pub max_score: Option<i32>,
    pub percentage: Option<f64>,
    pub time_taken_seconds: Option<i32>,
}
