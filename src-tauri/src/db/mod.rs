use rusqlite::{Connection, Result};
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub mod models;

const SCHEMA_SQL: &str = include_str!("schema.sql");

pub struct DbConnection(pub Mutex<Connection>);

/// Get the path to the database file
pub fn get_db_path(app: &AppHandle) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;

    // Ensure the directory exists
    fs::create_dir_all(&app_data_dir)?;

    let db_path = app_data_dir.join("quizforge.db");
    Ok(db_path)
}

/// Initialize the database
pub async fn init_database(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path(app)?;
    println!("Database path: {:?}", db_path);

    // Open connection
    let conn = Connection::open(&db_path)?;

    // Enable foreign key constraints (required for CASCADE deletes)
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Execute schema
    let statements: Vec<&str> = SCHEMA_SQL
        .split(';')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    for statement in statements {
        conn.execute(statement, [])?;
    }

    println!("Database initialized successfully");

    // Store connection in app state
    app.manage(DbConnection(Mutex::new(conn)));

    Ok(())
}

// Note: get_connection helper is not needed since commands use State<DbConnection> directly
