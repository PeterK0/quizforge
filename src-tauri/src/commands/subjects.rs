use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbConnection;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subject {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSubjectData {
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSubjectData {
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: Option<String>,
}

#[tauri::command]
pub fn get_subjects(db: State<DbConnection>) -> Result<Vec<Subject>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, description, color, icon, created_at, updated_at FROM subjects ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let subjects = stmt
        .query_map([], |row| {
            Ok(Subject {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                icon: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(subjects)
}

#[tauri::command]
pub fn get_subject(db: State<DbConnection>, id: i64) -> Result<Subject, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let subject = conn
        .query_row(
            "SELECT id, name, description, color, icon, created_at, updated_at FROM subjects WHERE id = ?",
            [id],
            |row| {
                Ok(Subject {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    icon: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(subject)
}

#[tauri::command]
pub fn create_subject(db: State<DbConnection>, data: CreateSubjectData) -> Result<Subject, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO subjects (name, description, color, icon) VALUES (?1, ?2, ?3, ?4)",
        (&data.name, &data.description, &data.color, &data.icon),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let subject = conn
        .query_row(
            "SELECT id, name, description, color, icon, created_at, updated_at FROM subjects WHERE id = ?",
            [id],
            |row| {
                Ok(Subject {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    icon: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(subject)
}

#[tauri::command]
pub fn update_subject(
    db: State<DbConnection>,
    id: i64,
    data: UpdateSubjectData,
) -> Result<Subject, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE subjects SET name = ?1, description = ?2, color = ?3, icon = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?5",
        (&data.name, &data.description, &data.color, &data.icon, id),
    )
    .map_err(|e| e.to_string())?;

    let subject = conn
        .query_row(
            "SELECT id, name, description, color, icon, created_at, updated_at FROM subjects WHERE id = ?",
            [id],
            |row| {
                Ok(Subject {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    icon: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(subject)
}

#[tauri::command]
pub fn delete_subject(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Enable foreign keys for cascade deletes
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM subjects WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
