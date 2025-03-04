// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use tauri::api::path::{app_data_dir, app_cache_dir};
use log::{info, error, debug, LevelFilter};
use env_logger;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct SaveDrawingArgs {
    elements: serde_json::Value,
    app_state: serde_json::Value,
}

// struct SaveDrawingArgs {
//     data: String,
// }

// Command to save drawing data to a file
#[tauri::command]
fn save_drawing(app_handle: tauri::AppHandle, args: SaveDrawingArgs) -> Result<(), String> {
    // Get the app data directory
    let app_data_dir = tauri::api::path::app_data_dir(&app_handle.config())
        .ok_or("Failed to get app data directory")?;
    
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    
    let app_name = &app_handle.config().tauri.bundle.identifier;
    let cache_dir = app_data_dir.join("cache").join(app_name);
    
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    
    let file_path = cache_dir.join("drawing-data.excalidraw");
    
    // Convert args to a JSON string
    let data = serde_json::to_string(&args).map_err(|e| e.to_string())?;
    
    fs::write(&file_path, data).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Command to load drawing data from a file
#[tauri::command]
fn load_drawing(app_handle: tauri::AppHandle) -> Result<String, String> {
    // Get the app data directory
    let app_data_dir = app_data_dir(&app_handle.config()).expect("Failed to get app data directory");
    debug!("App data directory: {:?}", app_data_dir);
    
    // Define the path for the drawing file
    let app_name = &app_handle.config().tauri.bundle.identifier;
    let cache_dir = app_data_dir.join("cache").join(app_name);
    let file_path = cache_dir.join("drawing-data.excalidraw");
    debug!("Looking for drawing at: {:?}", file_path);
    
    // Check if the file exists
    if (!file_path.exists()) {
        info!("No saved drawing found at {:?}", file_path);
        return Ok("".to_string()); // Return empty string if no saved data
    }
    
    // Read the data from the file
    info!("Loading drawing from: {:?}", file_path);
    let data = fs::read_to_string(file_path).map_err(|e| {
        error!("Failed to read drawing data: {}", e);
        e.to_string()
    })?;
    
    debug!("Drawing loaded successfully");
    Ok(data)
}

// Utility command to check paths and permissions
#[tauri::command]
fn check_storage_paths(app_handle: tauri::AppHandle) -> Result<String, String> {
    info!("Checking storage paths");
    
    let mut result = String::new();
    
    // Check app data directory
    match app_data_dir(&app_handle.config()) {
        Some(app_data_dir) => {
            result.push_str(&format!("App data directory: {:?}\n", app_data_dir));
            
            // Check if directory exists
            if (app_data_dir.exists()) {
                result.push_str("  - Directory exists\n");
                
                // Check if directory is writable
                let test_file = app_data_dir.join("write_test.tmp");
                match fs::write(&test_file, "test") {
                    Ok(_) => {
                        result.push_str("  - Directory is writable\n");
                        let _ = fs::remove_file(test_file); // Clean up
                    },
                    Err(e) => {
                        result.push_str(&format!("  - Directory is NOT writable: {}\n", e));
                    }
                }
            } else {
                result.push_str("  - Directory does NOT exist\n");
                
                // Try to create it
                match fs::create_dir_all(&app_data_dir) {
                    Ok(_) => result.push_str("  - Successfully created directory\n"),
                    Err(e) => result.push_str(&format!("  - Failed to create directory: {}\n", e))
                }
            }
        },
        None => {
            result.push_str("Failed to get app data directory\n");
        }
    }
    
    // Check app cache directory
    match app_cache_dir(&app_handle.config()) {
        Some(cache_dir) => {
            result.push_str(&format!("App cache directory: {:?}\n", cache_dir));
            
            // Check if directory exists
            if (cache_dir.exists()) {
                result.push_str("  - Directory exists\n");
            } else {
                result.push_str("  - Directory does NOT exist\n");
                
                // Try to create it
                match fs::create_dir_all(&cache_dir) {
                    Ok(_) => result.push_str("  - Successfully created directory\n"),
                    Err(e) => result.push_str(&format!("  - Failed to create directory: {}\n", e))
                }
            }
            
            // Check app-specific cache directory
            let app_name = &app_handle.config().tauri.bundle.identifier;
            let app_cache_dir = cache_dir.join(app_name);
            result.push_str(&format!("App-specific cache directory: {:?}\n", app_cache_dir));
            
            // Try to create it if it doesn't exist
            if (!app_cache_dir.exists()) {
                match fs::create_dir_all(&app_cache_dir) {
                    Ok(_) => result.push_str("  - Successfully created app-specific cache directory\n"),
                    Err(e) => result.push_str(&format!("  - Failed to create app-specific cache directory: {}\n", e))
                }
            }
            
            // Try to write a test file
            let test_file = app_cache_dir.join("write_test.tmp");
            match fs::write(&test_file, "test") {
                Ok(_) => {
                    result.push_str("  - App-specific cache is writable\n");
                    let _ = fs::remove_file(test_file); // Clean up
                },
                Err(e) => {
                    result.push_str(&format!("  - App-specific cache is NOT writable: {}\n", e));
                }
            }
        },
        None => {
            result.push_str("Failed to get app cache directory\n");
        }
    }
    
    // Check our specific excalidraw file path
    let app_data_dir = match app_data_dir(&app_handle.config()) {
        Some(dir) => dir,
        None => return Ok(result),
    };
    
    let app_name = &app_handle.config().tauri.bundle.identifier;
    let cache_dir = app_data_dir.join("cache").join(app_name);
    let file_path = cache_dir.join("drawing-data.excalidraw");
    
    result.push_str(&format!("\nExcalidraw file path: {:?}\n", file_path));
    
    if (file_path.exists()) {
        result.push_str("  - File exists\n");
        match fs::metadata(&file_path) {
            Ok(metadata) => {
                result.push_str(&format!("  - File size: {} bytes\n", metadata.len()));
            },
            Err(e) => {
                result.push_str(&format!("  - Failed to get file metadata: {}\n", e));
            }
        }
    } else {
        result.push_str("  - File does NOT exist yet\n");
    }
    
    info!("Storage path check completed");
    Ok(result)
}

fn main() {
  // Initialize the logger with more verbose output
  env_logger::builder()
    .filter_level(LevelFilter::Info) // Always use Info level for better debugging
    .init();

  info!("Starting Draw application");
  
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_drawing, load_drawing, check_storage_paths])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
