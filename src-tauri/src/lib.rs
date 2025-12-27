mod commands;
mod db;

use commands::subjects::*;
use commands::topics::*;
use commands::questions::*;
use commands::quizzes::*;
use commands::exams::*;
use commands::images::*;

#[allow(unused_imports)]
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_database(&app_handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_subjects,
            get_subject,
            create_subject,
            update_subject,
            delete_subject,
            get_topics,
            get_topic,
            create_topic,
            update_topic,
            delete_topic,
            get_questions,
            get_question,
            create_question,
            update_question,
            delete_question,
            get_quizzes,
            get_quiz,
            create_quiz,
            update_quiz,
            delete_quiz,
            get_all_quiz_attempts,
            save_quiz_attempt,
            get_topic_performance,
            get_exams,
            get_exam,
            create_exam,
            update_exam,
            delete_exam,
            get_all_exam_attempts,
            save_exam_attempt,
            get_subject_performance,
            copy_image_to_assets,
            read_image_as_data_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
