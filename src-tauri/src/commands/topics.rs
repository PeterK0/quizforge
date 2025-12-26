use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbConnection;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Topic {
    pub id: i64,
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub week_number: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTopicData {
    pub subject_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub week_number: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTopicData {
    pub name: String,
    pub description: Option<String>,
    pub week_number: Option<i32>,
}

#[tauri::command]
pub fn get_topics(db: State<DbConnection>, subject_id: i64) -> Result<Vec<Topic>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, subject_id, name, description, week_number, created_at, updated_at FROM topics WHERE subject_id = ? ORDER BY week_number ASC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let topics = stmt
        .query_map([subject_id], |row| {
            Ok(Topic {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                week_number: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(topics)
}

#[tauri::command]
pub fn get_topic(db: State<DbConnection>, id: i64) -> Result<Topic, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let topic = conn
        .query_row(
            "SELECT id, subject_id, name, description, week_number, created_at, updated_at FROM topics WHERE id = ?",
            [id],
            |row| {
                Ok(Topic {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    week_number: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(topic)
}

#[tauri::command]
pub fn create_topic(db: State<DbConnection>, data: CreateTopicData) -> Result<Topic, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO topics (subject_id, name, description, week_number) VALUES (?1, ?2, ?3, ?4)",
        (&data.subject_id, &data.name, &data.description, &data.week_number),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let topic = conn
        .query_row(
            "SELECT id, subject_id, name, description, week_number, created_at, updated_at FROM topics WHERE id = ?",
            [id],
            |row| {
                Ok(Topic {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    week_number: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(topic)
}

#[tauri::command]
pub fn update_topic(db: State<DbConnection>, id: i64, data: UpdateTopicData) -> Result<Topic, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE topics SET name = ?1, description = ?2, week_number = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
        (&data.name, &data.description, &data.week_number, id),
    )
    .map_err(|e| e.to_string())?;

    let topic = conn
        .query_row(
            "SELECT id, subject_id, name, description, week_number, created_at, updated_at FROM topics WHERE id = ?",
            [id],
            |row| {
                Ok(Topic {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    week_number: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(topic)
}

#[tauri::command]
pub fn delete_topic(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Enable foreign keys for cascade deletes
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM topics WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
