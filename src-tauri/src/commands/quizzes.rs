use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbConnection;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuizData {
    pub topic_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateQuizData {
    pub name: String,
    pub description: Option<String>,
    pub question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
}

#[tauri::command]
pub fn get_quizzes(db: State<DbConnection>, topic_id: i64) -> Result<Vec<Quiz>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, topic_id, name, description, question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM quizzes WHERE topic_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let quizzes = stmt
        .query_map([topic_id], |row| {
            Ok(Quiz {
                id: row.get(0)?,
                topic_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                question_count: row.get(4)?,
                time_limit_minutes: row.get(5)?,
                shuffle_questions: row.get::<_, i32>(6)? != 0,
                shuffle_options: row.get::<_, i32>(7)? != 0,
                show_answers_after: row.get(8)?,
                passing_score_percent: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(quizzes)
}

#[tauri::command]
pub fn get_quiz(db: State<DbConnection>, id: i64) -> Result<Quiz, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let quiz = conn
        .query_row(
            "SELECT id, topic_id, name, description, question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM quizzes WHERE id = ?",
            [id],
            |row| {
                Ok(Quiz {
                    id: row.get(0)?,
                    topic_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    question_count: row.get(4)?,
                    time_limit_minutes: row.get(5)?,
                    shuffle_questions: row.get::<_, i32>(6)? != 0,
                    shuffle_options: row.get::<_, i32>(7)? != 0,
                    show_answers_after: row.get(8)?,
                    passing_score_percent: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(quiz)
}

#[tauri::command]
pub fn create_quiz(db: State<DbConnection>, data: CreateQuizData) -> Result<Quiz, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO quizzes (topic_id, name, description, question_count, time_limit_minutes,
         shuffle_questions, shuffle_options, show_answers_after, passing_score_percent)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            data.topic_id,
            &data.name,
            &data.description,
            data.question_count,
            data.time_limit_minutes,
            data.shuffle_questions as i32,
            data.shuffle_options as i32,
            &data.show_answers_after,
            data.passing_score_percent,
        ),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let quiz = conn
        .query_row(
            "SELECT id, topic_id, name, description, question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM quizzes WHERE id = ?",
            [id],
            |row| {
                Ok(Quiz {
                    id: row.get(0)?,
                    topic_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    question_count: row.get(4)?,
                    time_limit_minutes: row.get(5)?,
                    shuffle_questions: row.get::<_, i32>(6)? != 0,
                    shuffle_options: row.get::<_, i32>(7)? != 0,
                    show_answers_after: row.get(8)?,
                    passing_score_percent: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(quiz)
}

#[tauri::command]
pub fn update_quiz(
    db: State<DbConnection>,
    id: i64,
    data: UpdateQuizData,
) -> Result<Quiz, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE quizzes SET name = ?1, description = ?2, question_count = ?3,
         time_limit_minutes = ?4, shuffle_questions = ?5, shuffle_options = ?6,
         show_answers_after = ?7, passing_score_percent = ?8, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?9",
        (
            &data.name,
            &data.description,
            data.question_count,
            data.time_limit_minutes,
            data.shuffle_questions as i32,
            data.shuffle_options as i32,
            &data.show_answers_after,
            data.passing_score_percent,
            id,
        ),
    )
    .map_err(|e| e.to_string())?;

    let quiz = conn
        .query_row(
            "SELECT id, topic_id, name, description, question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM quizzes WHERE id = ?",
            [id],
            |row| {
                Ok(Quiz {
                    id: row.get(0)?,
                    topic_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    question_count: row.get(4)?,
                    time_limit_minutes: row.get(5)?,
                    shuffle_questions: row.get::<_, i32>(6)? != 0,
                    shuffle_options: row.get::<_, i32>(7)? != 0,
                    show_answers_after: row.get(8)?,
                    passing_score_percent: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(quiz)
}

#[tauri::command]
pub fn delete_quiz(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Enable foreign keys for cascade deletes
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM quizzes WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizAttemptWithDetails {
    pub id: i64,
    pub quiz_id: i64,
    pub quiz_name: String,
    pub topic_name: String,
    pub subject_name: String,
    pub started_at: String,
    pub completed_at: String,
    pub score: i32,
    pub max_score: i32,
    pub percentage: f64,
    pub time_taken_seconds: i32,
    pub passed: bool,
}

#[tauri::command]
pub fn get_all_quiz_attempts(db: State<DbConnection>) -> Result<Vec<QuizAttemptWithDetails>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT
            qa.id,
            qa.quiz_id,
            q.name as quiz_name,
            q.passing_score_percent,
            t.name as topic_name,
            s.name as subject_name,
            qa.started_at,
            qa.completed_at,
            qa.score,
            qa.max_score,
            qa.percentage,
            qa.time_taken_seconds
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.id
         JOIN topics t ON q.topic_id = t.id
         JOIN subjects s ON t.subject_id = s.id
         ORDER BY qa.completed_at DESC"
    ).map_err(|e| e.to_string())?;

    let attempts = stmt.query_map([], |row| {
        let percentage: f64 = row.get(10)?;
        let passing_score: i32 = row.get(3)?;

        Ok(QuizAttemptWithDetails {
            id: row.get(0)?,
            quiz_id: row.get(1)?,
            quiz_name: row.get(2)?,
            topic_name: row.get(4)?,
            subject_name: row.get(5)?,
            started_at: row.get(6)?,
            completed_at: row.get(7)?,
            score: row.get(8)?,
            max_score: row.get(9)?,
            percentage,
            time_taken_seconds: row.get(11)?,
            passed: percentage >= passing_score as f64,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(attempts)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveQuizAttemptData {
    pub quiz_id: i64,
    pub score: i32,
    pub max_score: i32,
    pub percentage: f64,
    pub time_taken_seconds: i32,
}

#[tauri::command]
pub fn save_quiz_attempt(db: State<DbConnection>, data: SaveQuizAttemptData) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO quiz_attempts (quiz_id, score, max_score, percentage, time_taken_seconds, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
        (
            data.quiz_id,
            data.score,
            data.max_score,
            data.percentage,
            data.time_taken_seconds,
        ),
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopicPerformance {
    pub topic_name: String,
    pub subject_name: String,
    pub attempts: i32,
    pub average_score: f64,
    pub pass_rate: f64,
}

#[tauri::command]
pub fn get_topic_performance(db: State<DbConnection>) -> Result<Vec<TopicPerformance>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT
            t.name as topic_name,
            s.name as subject_name,
            COUNT(qa.id) as attempts,
            AVG(qa.percentage) as average_score,
            SUM(CASE WHEN qa.percentage >= q.passing_score_percent THEN 1 ELSE 0 END) * 100.0 / COUNT(qa.id) as pass_rate
         FROM topics t
         JOIN subjects s ON t.subject_id = s.id
         JOIN quizzes q ON q.topic_id = t.id
         JOIN quiz_attempts qa ON qa.quiz_id = q.id
         GROUP BY t.id, t.name, s.name
         HAVING COUNT(qa.id) > 0
         ORDER BY average_score DESC"
    ).map_err(|e| e.to_string())?;

    let performance = stmt.query_map([], |row| {
        Ok(TopicPerformance {
            topic_name: row.get(0)?,
            subject_name: row.get(1)?,
            attempts: row.get(2)?,
            average_score: row.get(3)?,
            pass_rate: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(performance)
}
