use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuestionOption {
    pub id: i64,
    pub question_id: i64,
    pub option_text: String,
    pub option_image_path: Option<String>,
    pub is_correct: bool,
    pub display_order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuestionBlank {
    pub id: i64,
    pub question_id: i64,
    pub blank_index: i32,
    pub correct_answer: String,
    pub acceptable_answers: Option<String>,
    pub is_numeric: bool,
    pub numeric_tolerance: Option<f64>,
    pub unit: Option<String>,
    pub input_type: String,
    pub dropdown_options: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuestionOrderItem {
    pub id: i64,
    pub question_id: i64,
    pub item_text: String,
    pub correct_position: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuestionMatch {
    pub id: i64,
    pub question_id: i64,
    pub left_item: String,
    pub right_item: String,
    pub left_image_path: Option<String>,
    pub right_image_path: Option<String>,
    pub display_order: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionWithDetails {
    #[serde(flatten)]
    pub question: Question,
    pub options: Vec<QuestionOption>,
    pub blanks: Vec<QuestionBlank>,
    pub order_items: Vec<QuestionOrderItem>,
    pub matches: Vec<QuestionMatch>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuestionData {
    pub subject_id: i64,
    pub topic_id: i64,
    pub question_type: String,
    pub question_text: String,
    pub question_image_path: Option<String>,
    pub explanation: Option<String>,
    pub difficulty: String,
    pub points: i32,
    pub source: Option<String>,
    pub options: Vec<CreateQuestionOption>,
    pub blanks: Vec<CreateQuestionBlank>,
    pub numeric_data: Option<CreateNumericData>,
    pub order_items: Option<Vec<CreateOrderItem>>,
    pub match_pairs: Option<Vec<CreateMatchPair>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuestionOption {
    pub option_text: String,
    pub option_image_path: Option<String>,
    pub is_correct: bool,
    pub display_order: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuestionBlank {
    pub blank_index: i32,
    pub correct_answer: String,
    pub acceptable_answers: Option<String>,
    pub is_numeric: bool,
    pub numeric_tolerance: Option<f64>,
    pub unit: Option<String>,
    pub input_type: String,
    pub dropdown_options: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNumericData {
    pub correct_answer: String,
    pub tolerance: String,
    pub unit: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOrderItem {
    pub text: String,
    pub correct_position: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMatchPair {
    pub left_item: String,
    pub right_item: String,
    pub left_image_path: Option<String>,
    pub right_image_path: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateQuestionData {
    pub question_text: String,
    pub question_image_path: Option<String>,
    pub explanation: Option<String>,
    pub difficulty: String,
    pub points: i32,
    pub source: Option<String>,
    pub options: Vec<CreateQuestionOption>,
    pub blanks: Vec<CreateQuestionBlank>,
    pub numeric_data: Option<CreateNumericData>,
    pub order_items: Option<Vec<CreateOrderItem>>,
    pub match_pairs: Option<Vec<CreateMatchPair>>,
}

#[tauri::command]
pub fn get_questions(
    db: State<DbConnection>,
    topic_id: i64,
) -> Result<Vec<QuestionWithDetails>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, subject_id, topic_id, question_type, question_text, question_image_path,
             explanation, difficulty, points, source, created_at, updated_at
             FROM questions WHERE topic_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let questions = stmt
        .query_map([topic_id], |row| {
            Ok(Question {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                topic_id: row.get(2)?,
                question_type: row.get(3)?,
                question_text: row.get(4)?,
                question_image_path: row.get(5)?,
                explanation: row.get(6)?,
                difficulty: row.get(7)?,
                points: row.get(8)?,
                source: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // For each question, fetch its options, blanks, order_items, and matches
    let mut questions_with_details = Vec::new();
    for question in questions {
        let options = get_question_options(&conn, question.id)?;
        let blanks = get_question_blanks(&conn, question.id)?;
        let order_items = get_question_order_items(&conn, question.id)?;
        let matches = get_question_matches(&conn, question.id)?;
        questions_with_details.push(QuestionWithDetails {
            question,
            options,
            blanks,
            order_items,
            matches,
        });
    }

    Ok(questions_with_details)
}

#[tauri::command]
pub fn get_question(db: State<DbConnection>, id: i64) -> Result<QuestionWithDetails, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let question = conn
        .query_row(
            "SELECT id, subject_id, topic_id, question_type, question_text, question_image_path,
             explanation, difficulty, points, source, created_at, updated_at
             FROM questions WHERE id = ?",
            [id],
            |row| {
                Ok(Question {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    topic_id: row.get(2)?,
                    question_type: row.get(3)?,
                    question_text: row.get(4)?,
                    question_image_path: row.get(5)?,
                    explanation: row.get(6)?,
                    difficulty: row.get(7)?,
                    points: row.get(8)?,
                    source: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let options = get_question_options(&conn, id)?;
    let blanks = get_question_blanks(&conn, id)?;
    let order_items = get_question_order_items(&conn, id)?;
    let matches = get_question_matches(&conn, id)?;

    Ok(QuestionWithDetails {
        question,
        options,
        blanks,
        order_items,
        matches,
    })
}

#[tauri::command]
pub fn create_question(
    db: State<DbConnection>,
    data: CreateQuestionData,
) -> Result<QuestionWithDetails, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Insert the question
    conn.execute(
        "INSERT INTO questions (subject_id, topic_id, question_type, question_text,
         question_image_path, explanation, difficulty, points, source)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            &data.subject_id,
            &data.topic_id,
            &data.question_type,
            &data.question_text,
            &data.question_image_path,
            &data.explanation,
            &data.difficulty,
            &data.points,
            &data.source,
        ),
    )
    .map_err(|e| e.to_string())?;

    let question_id = conn.last_insert_rowid();

    // Insert options if any
    for option in &data.options {
        conn.execute(
            "INSERT INTO question_options (question_id, option_text, option_image_path, is_correct, display_order)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            (
                question_id,
                &option.option_text,
                &option.option_image_path,
                option.is_correct as i32,
                option.display_order,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert blanks if any
    for blank in &data.blanks {
        conn.execute(
            "INSERT INTO question_blanks (question_id, blank_index, correct_answer, acceptable_answers,
             is_numeric, numeric_tolerance, unit, input_type, dropdown_options)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                question_id,
                blank.blank_index,
                &blank.correct_answer,
                &blank.acceptable_answers,
                blank.is_numeric as i32,
                blank.numeric_tolerance,
                &blank.unit,
                &blank.input_type,
                &blank.dropdown_options,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert numeric data as a blank if present
    if let Some(numeric_data) = &data.numeric_data {
        let tolerance: f64 = numeric_data.tolerance.parse().unwrap_or(0.1);
        conn.execute(
            "INSERT INTO question_blanks (question_id, blank_index, correct_answer, acceptable_answers,
             is_numeric, numeric_tolerance, unit, input_type, dropdown_options)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                question_id,
                0,
                &numeric_data.correct_answer,
                None::<String>,
                1,
                Some(tolerance),
                &numeric_data.unit,
                "INPUT",
                None::<String>,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert order items if any
    if let Some(order_items) = &data.order_items {
        for item in order_items {
            conn.execute(
                "INSERT INTO question_order_items (question_id, item_text, correct_position)
                 VALUES (?1, ?2, ?3)",
                (
                    question_id,
                    &item.text,
                    item.correct_position,
                ),
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // Insert match pairs if any
    if let Some(match_pairs) = &data.match_pairs {
        for (index, pair) in match_pairs.iter().enumerate() {
            conn.execute(
                "INSERT INTO question_matches (question_id, left_item, right_item, left_image_path, right_image_path, display_order)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                (
                    question_id,
                    &pair.left_item,
                    &pair.right_item,
                    &pair.left_image_path,
                    &pair.right_image_path,
                    index as i32,
                ),
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // Fetch and return the created question with details
    let question = conn
        .query_row(
            "SELECT id, subject_id, topic_id, question_type, question_text, question_image_path,
             explanation, difficulty, points, source, created_at, updated_at
             FROM questions WHERE id = ?",
            [question_id],
            |row| {
                Ok(Question {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    topic_id: row.get(2)?,
                    question_type: row.get(3)?,
                    question_text: row.get(4)?,
                    question_image_path: row.get(5)?,
                    explanation: row.get(6)?,
                    difficulty: row.get(7)?,
                    points: row.get(8)?,
                    source: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let options = get_question_options(&conn, question_id)?;
    let blanks = get_question_blanks(&conn, question_id)?;
    let order_items = get_question_order_items(&conn, question_id)?;
    let matches = get_question_matches(&conn, question_id)?;

    Ok(QuestionWithDetails {
        question,
        options,
        blanks,
        order_items,
        matches,
    })
}

#[tauri::command]
pub fn update_question(
    db: State<DbConnection>,
    id: i64,
    data: UpdateQuestionData,
) -> Result<QuestionWithDetails, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Update the question
    conn.execute(
        "UPDATE questions SET question_text = ?1, question_image_path = ?2, explanation = ?3,
         difficulty = ?4, points = ?5, source = ?6, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?7",
        (
            &data.question_text,
            &data.question_image_path,
            &data.explanation,
            &data.difficulty,
            &data.points,
            &data.source,
            id,
        ),
    )
    .map_err(|e| e.to_string())?;

    // Delete existing options, blanks, order_items, and matches
    conn.execute("DELETE FROM question_options WHERE question_id = ?", [id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM question_blanks WHERE question_id = ?", [id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM question_order_items WHERE question_id = ?", [id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM question_matches WHERE question_id = ?", [id])
        .map_err(|e| e.to_string())?;

    // Insert new options
    for option in &data.options {
        conn.execute(
            "INSERT INTO question_options (question_id, option_text, option_image_path, is_correct, display_order)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            (
                id,
                &option.option_text,
                &option.option_image_path,
                option.is_correct as i32,
                option.display_order,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert new blanks
    for blank in &data.blanks {
        conn.execute(
            "INSERT INTO question_blanks (question_id, blank_index, correct_answer, acceptable_answers,
             is_numeric, numeric_tolerance, unit, input_type, dropdown_options)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                id,
                blank.blank_index,
                &blank.correct_answer,
                &blank.acceptable_answers,
                blank.is_numeric as i32,
                blank.numeric_tolerance,
                &blank.unit,
                &blank.input_type,
                &blank.dropdown_options,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert numeric data as a blank if present
    if let Some(numeric_data) = &data.numeric_data {
        let tolerance: f64 = numeric_data.tolerance.parse().unwrap_or(0.1);
        conn.execute(
            "INSERT INTO question_blanks (question_id, blank_index, correct_answer, acceptable_answers,
             is_numeric, numeric_tolerance, unit, input_type, dropdown_options)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                id,
                0,
                &numeric_data.correct_answer,
                None::<String>,
                1,
                Some(tolerance),
                &numeric_data.unit,
                "INPUT",
                None::<String>,
            ),
        )
        .map_err(|e| e.to_string())?;
    }

    // Insert order items if any
    if let Some(order_items) = &data.order_items {
        for item in order_items {
            conn.execute(
                "INSERT INTO question_order_items (question_id, item_text, correct_position)
                 VALUES (?1, ?2, ?3)",
                (
                    id,
                    &item.text,
                    item.correct_position,
                ),
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // Insert match pairs if any
    if let Some(match_pairs) = &data.match_pairs {
        for (index, pair) in match_pairs.iter().enumerate() {
            conn.execute(
                "INSERT INTO question_matches (question_id, left_item, right_item, left_image_path, right_image_path, display_order)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                (
                    id,
                    &pair.left_item,
                    &pair.right_item,
                    &pair.left_image_path,
                    &pair.right_image_path,
                    index as i32,
                ),
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // Fetch and return the updated question with details
    let question = conn
        .query_row(
            "SELECT id, subject_id, topic_id, question_type, question_text, question_image_path,
             explanation, difficulty, points, source, created_at, updated_at
             FROM questions WHERE id = ?",
            [id],
            |row| {
                Ok(Question {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    topic_id: row.get(2)?,
                    question_type: row.get(3)?,
                    question_text: row.get(4)?,
                    question_image_path: row.get(5)?,
                    explanation: row.get(6)?,
                    difficulty: row.get(7)?,
                    points: row.get(8)?,
                    source: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let options = get_question_options(&conn, id)?;
    let blanks = get_question_blanks(&conn, id)?;
    let order_items = get_question_order_items(&conn, id)?;
    let matches = get_question_matches(&conn, id)?;

    Ok(QuestionWithDetails {
        question,
        options,
        blanks,
        order_items,
        matches,
    })
}

#[tauri::command]
pub fn delete_question(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Enable foreign keys for cascade deletes
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;

    // SQLite CASCADE will handle deleting related options and blanks
    conn.execute("DELETE FROM questions WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Helper functions
fn get_question_options(
    conn: &rusqlite::Connection,
    question_id: i64,
) -> Result<Vec<QuestionOption>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, question_id, option_text, option_image_path, is_correct, display_order
             FROM question_options WHERE question_id = ? ORDER BY display_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let options = stmt
        .query_map([question_id], |row| {
            Ok(QuestionOption {
                id: row.get(0)?,
                question_id: row.get(1)?,
                option_text: row.get(2)?,
                option_image_path: row.get(3)?,
                is_correct: row.get::<_, i32>(4)? != 0,
                display_order: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(options)
}

fn get_question_blanks(
    conn: &rusqlite::Connection,
    question_id: i64,
) -> Result<Vec<QuestionBlank>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, question_id, blank_index, correct_answer, acceptable_answers,
             is_numeric, numeric_tolerance, unit, input_type, dropdown_options
             FROM question_blanks WHERE question_id = ? ORDER BY blank_index ASC",
        )
        .map_err(|e| e.to_string())?;

    let blanks = stmt
        .query_map([question_id], |row| {
            Ok(QuestionBlank {
                id: row.get(0)?,
                question_id: row.get(1)?,
                blank_index: row.get(2)?,
                correct_answer: row.get(3)?,
                acceptable_answers: row.get(4)?,
                is_numeric: row.get::<_, i32>(5)? != 0,
                numeric_tolerance: row.get(6)?,
                unit: row.get(7)?,
                input_type: row.get::<_, Option<String>>(8)?.unwrap_or_else(|| "INPUT".to_string()),
                dropdown_options: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(blanks)
}

fn get_question_order_items(
    conn: &rusqlite::Connection,
    question_id: i64,
) -> Result<Vec<QuestionOrderItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, question_id, item_text, correct_position
             FROM question_order_items WHERE question_id = ? ORDER BY correct_position ASC",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([question_id], |row| {
            Ok(QuestionOrderItem {
                id: row.get(0)?,
                question_id: row.get(1)?,
                item_text: row.get(2)?,
                correct_position: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

fn get_question_matches(
    conn: &rusqlite::Connection,
    question_id: i64,
) -> Result<Vec<QuestionMatch>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, question_id, left_item, right_item, left_image_path, right_image_path, display_order
             FROM question_matches WHERE question_id = ? ORDER BY display_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let matches = stmt
        .query_map([question_id], |row| {
            Ok(QuestionMatch {
                id: row.get(0)?,
                question_id: row.get(1)?,
                left_item: row.get(2)?,
                right_item: row.get(3)?,
                left_image_path: row.get(4)?,
                right_image_path: row.get(5)?,
                display_order: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(matches)
}
