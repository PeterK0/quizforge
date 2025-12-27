use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn copy_image_to_assets(
    app_handle: AppHandle,
    source_path: String,
) -> Result<String, String> {
    // Get the app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    // Create assets/images directory if it doesn't exist
    let images_dir = app_data_dir.join("assets").join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    // Get the source file name
    let source_path_buf = PathBuf::from(&source_path);
    let file_stem = source_path_buf
        .file_stem()
        .ok_or("Invalid file path")?
        .to_str()
        .ok_or("Invalid file name")?;

    let extension = source_path_buf
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    // Generate a unique filename using timestamp
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to get timestamp: {}", e))?
        .as_millis();

    let unique_filename = format!("{}_{}.{}", timestamp, file_stem, extension);
    let dest_path = images_dir.join(&unique_filename);

    // Copy the file
    fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to copy image: {}", e))?;

    // Return the relative path from app data dir
    let relative_path = format!("assets/images/{}", unique_filename);
    Ok(relative_path)
}

#[tauri::command]
pub fn read_image_as_data_url(
    app_handle: AppHandle,
    relative_path: String,
) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let full_path = app_data_dir.join(&relative_path);

    // Read the file
    let image_data = fs::read(&full_path)
        .map_err(|e| format!("Failed to read image: {}", e))?;

    // Get file extension for MIME type
    let extension = full_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "image/png",
    };

    // Convert to base64
    let base64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &image_data);
    let data_url = format!("data:{};base64,{}", mime_type, base64);

    Ok(data_url)
}
