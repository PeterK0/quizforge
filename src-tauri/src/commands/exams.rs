use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbConnection;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamTopic {
    pub id: i64,
    pub exam_id: i64,
    pub topic_id: i64,
    pub question_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    pub topics: Vec<ExamTopicWithName>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamTopicWithName {
    pub id: i64,
    pub exam_id: i64,
    pub topic_id: i64,
    pub topic_name: String,
    pub question_count: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExamTopicData {
    pub topic_id: i64,
    pub question_count: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExamData {
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub total_question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
    pub topics: Vec<CreateExamTopicData>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExamData {
    pub name: String,
    pub description: Option<String>,
    pub total_question_count: i32,
    pub time_limit_minutes: Option<i32>,
    pub shuffle_questions: bool,
    pub shuffle_options: bool,
    pub show_answers_after: String,
    pub passing_score_percent: i32,
    pub topics: Vec<CreateExamTopicData>,
}

#[tauri::command]
pub fn get_exams(db: State<DbConnection>, subject_id: i64) -> Result<Vec<ExamWithTopics>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, subject_id, name, description, total_question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM exams WHERE subject_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let exams = stmt
        .query_map([subject_id], |row| {
            Ok(Exam {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                total_question_count: row.get(4)?,
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

    // For each exam, fetch its topics
    let mut exams_with_topics = Vec::new();
    for exam in exams {
        let mut topic_stmt = conn
            .prepare(
                "SELECT et.id, et.exam_id, et.topic_id, t.name, et.question_count
                 FROM exam_topics et
                 JOIN topics t ON et.topic_id = t.id
                 WHERE et.exam_id = ?
                 ORDER BY t.name",
            )
            .map_err(|e| e.to_string())?;

        let topics = topic_stmt
            .query_map([exam.id], |row| {
                Ok(ExamTopicWithName {
                    id: row.get(0)?,
                    exam_id: row.get(1)?,
                    topic_id: row.get(2)?,
                    topic_name: row.get(3)?,
                    question_count: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        exams_with_topics.push(ExamWithTopics {
            id: exam.id,
            subject_id: exam.subject_id,
            name: exam.name,
            description: exam.description,
            total_question_count: exam.total_question_count,
            time_limit_minutes: exam.time_limit_minutes,
            shuffle_questions: exam.shuffle_questions,
            shuffle_options: exam.shuffle_options,
            show_answers_after: exam.show_answers_after,
            passing_score_percent: exam.passing_score_percent,
            created_at: exam.created_at,
            updated_at: exam.updated_at,
            topics,
        });
    }

    Ok(exams_with_topics)
}

#[tauri::command]
pub fn get_exam(db: State<DbConnection>, id: i64) -> Result<ExamWithTopics, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let exam = conn
        .query_row(
            "SELECT id, subject_id, name, description, total_question_count, time_limit_minutes,
             shuffle_questions, shuffle_options, show_answers_after, passing_score_percent,
             created_at, updated_at
             FROM exams WHERE id = ?",
            [id],
            |row| {
                Ok(Exam {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    total_question_count: row.get(4)?,
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

    // Fetch topics for this exam
    let mut topic_stmt = conn
        .prepare(
            "SELECT et.id, et.exam_id, et.topic_id, t.name, et.question_count
             FROM exam_topics et
             JOIN topics t ON et.topic_id = t.id
             WHERE et.exam_id = ?
             ORDER BY t.name",
        )
        .map_err(|e| e.to_string())?;

    let topics = topic_stmt
        .query_map([id], |row| {
            Ok(ExamTopicWithName {
                id: row.get(0)?,
                exam_id: row.get(1)?,
                topic_id: row.get(2)?,
                topic_name: row.get(3)?,
                question_count: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ExamWithTopics {
        id: exam.id,
        subject_id: exam.subject_id,
        name: exam.name,
        description: exam.description,
        total_question_count: exam.total_question_count,
        time_limit_minutes: exam.time_limit_minutes,
        shuffle_questions: exam.shuffle_questions,
        shuffle_options: exam.shuffle_options,
        show_answers_after: exam.show_answers_after,
        passing_score_percent: exam.passing_score_percent,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
        topics,
    })
}

#[tauri::command]
pub fn create_exam(db: State<DbConnection>, data: CreateExamData) -> Result<ExamWithTopics, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    // Start transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Insert exam
    tx.execute(
        "INSERT INTO exams (subject_id, name, description, total_question_count, time_limit_minutes,
         shuffle_questions, shuffle_options, show_answers_after, passing_score_percent)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            data.subject_id,
            &data.name,
            &data.description,
            data.total_question_count,
            data.time_limit_minutes,
            data.shuffle_questions as i32,
            data.shuffle_options as i32,
            &data.show_answers_after,
            data.passing_score_percent,
        ),
    )
    .map_err(|e| e.to_string())?;

    let exam_id = tx.last_insert_rowid();

    // Insert exam topics
    for topic in &data.topics {
        tx.execute(
            "INSERT INTO exam_topics (exam_id, topic_id, question_count) VALUES (?1, ?2, ?3)",
            (exam_id, topic.topic_id, topic.question_count),
        )
        .map_err(|e| e.to_string())?;
    }

    // Commit transaction
    tx.commit().map_err(|e| e.to_string())?;

    // Drop the connection lock before calling get_exam
    drop(conn);

    // Fetch and return the created exam
    get_exam(db, exam_id)
}

#[tauri::command]
pub fn update_exam(db: State<DbConnection>, id: i64, data: UpdateExamData) -> Result<ExamWithTopics, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    // Start transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Update exam
    tx.execute(
        "UPDATE exams SET name = ?1, description = ?2, total_question_count = ?3,
         time_limit_minutes = ?4, shuffle_questions = ?5, shuffle_options = ?6,
         show_answers_after = ?7, passing_score_percent = ?8, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?9",
        (
            &data.name,
            &data.description,
            data.total_question_count,
            data.time_limit_minutes,
            data.shuffle_questions as i32,
            data.shuffle_options as i32,
            &data.show_answers_after,
            data.passing_score_percent,
            id,
        ),
    )
    .map_err(|e| e.to_string())?;

    // Delete existing exam topics
    tx.execute("DELETE FROM exam_topics WHERE exam_id = ?", [id])
        .map_err(|e| e.to_string())?;

    // Insert new exam topics
    for topic in &data.topics {
        tx.execute(
            "INSERT INTO exam_topics (exam_id, topic_id, question_count) VALUES (?1, ?2, ?3)",
            (id, topic.topic_id, topic.question_count),
        )
        .map_err(|e| e.to_string())?;
    }

    // Commit transaction
    tx.commit().map_err(|e| e.to_string())?;

    // Drop the connection lock before calling get_exam
    drop(conn);

    // Fetch and return the updated exam
    get_exam(db, id)
}

#[tauri::command]
pub fn delete_exam(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM exams WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamAttemptWithDetails {
    pub id: i64,
    pub exam_id: i64,
    pub exam_name: String,
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
pub fn get_all_exam_attempts(db: State<DbConnection>) -> Result<Vec<ExamAttemptWithDetails>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT
            ea.id,
            ea.exam_id,
            e.name as exam_name,
            e.passing_score_percent,
            s.name as subject_name,
            ea.started_at,
            ea.completed_at,
            ea.score,
            ea.max_score,
            ea.percentage,
            ea.time_taken_seconds
         FROM exam_attempts ea
         JOIN exams e ON ea.exam_id = e.id
         JOIN subjects s ON e.subject_id = s.id
         ORDER BY ea.completed_at DESC"
    ).map_err(|e| e.to_string())?;

    let attempts = stmt.query_map([], |row| {
        let percentage: f64 = row.get(9)?;
        let passing_score: i32 = row.get(3)?;

        Ok(ExamAttemptWithDetails {
            id: row.get(0)?,
            exam_id: row.get(1)?,
            exam_name: row.get(2)?,
            subject_name: row.get(4)?,
            started_at: row.get(5)?,
            completed_at: row.get(6)?,
            score: row.get(7)?,
            max_score: row.get(8)?,
            percentage,
            time_taken_seconds: row.get(10)?,
            passed: percentage >= passing_score as f64,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(attempts)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveExamAttemptData {
    pub exam_id: i64,
    pub score: i32,
    pub max_score: i32,
    pub percentage: f64,
    pub time_taken_seconds: i32,
}

#[tauri::command]
pub fn save_exam_attempt(db: State<DbConnection>, data: SaveExamAttemptData) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO exam_attempts (exam_id, score, max_score, percentage, time_taken_seconds, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
        (
            data.exam_id,
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
pub struct SubjectPerformance {
    pub subject_name: String,
    pub attempts: i32,
    pub average_score: f64,
    pub pass_rate: f64,
}

#[tauri::command]
pub fn get_subject_performance(db: State<DbConnection>) -> Result<Vec<SubjectPerformance>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT
            s.name as subject_name,
            COUNT(ea.id) as attempts,
            AVG(ea.percentage) as average_score,
            SUM(CASE WHEN ea.percentage >= e.passing_score_percent THEN 1 ELSE 0 END) * 100.0 / COUNT(ea.id) as pass_rate
         FROM subjects s
         JOIN exams e ON e.subject_id = s.id
         JOIN exam_attempts ea ON ea.exam_id = e.id
         GROUP BY s.id, s.name
         HAVING COUNT(ea.id) > 0
         ORDER BY average_score DESC"
    ).map_err(|e| e.to_string())?;

    let performance = stmt.query_map([], |row| {
        Ok(SubjectPerformance {
            subject_name: row.get(0)?,
            attempts: row.get(1)?,
            average_score: row.get(2)?,
            pass_rate: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(performance)
}
