// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use tauri::api::path::{app_data_dir, app_cache_dir};
use log::{info, error, debug, LevelFilter};
use env_logger;
use serde::Deserialize;

// Struct to deserialize the data parameter from JavaScript
#[derive(Debug, Deserialize)]
struct SaveDrawingArgs {
    data: String,
}

// Command to save drawing data to a file
#[tauri::command]
fn save_drawing(app_handle: tauri::AppHandle, args: SaveDrawingArgs) -> Result<(), String> {
    info!("Save drawing called with data length: {}", args.data.len());
    
    // Get the app data directory
    let app_data_dir = match app_data_dir(&app_handle.config()) {
        Some(dir) => dir,
        None => {
            error!("Failed to get app data directory");
            return Err("Failed to get app data directory".to_string());
        }
    };
    
    info!("App data directory: {:?}", app_data_dir);
    
    // Create the directory if it doesn't exist
    if !app_data_dir.exists() {
        info!("Creating app data directory: {:?}", app_data_dir);
        if let Err(e) = fs::create_dir_all(&app_data_dir) {
            error!("Failed to create app data directory: {}", e);
            return Err(e.to_string());
        }
    }
    
    // Define the path for the drawing file
    let app_name = &app_handle.config().tauri.bundle.identifier;
    info!("App identifier: {}", app_name);
    
    let cache_dir = app_data_dir.join("cache").join(app_name);
    info!("Cache directory: {:?}", cache_dir);
    
    // Create cache directory if it doesn't exist
    if !cache_dir.exists() {
        info!("Creating cache directory: {:?}", cache_dir);
        if let Err(e) = fs::create_dir_all(&cache_dir) {
            error!("Failed to create cache directory: {}", e);
            return Err(e.to_string());
        }
    }
    
    // Define the path for the drawing file (in excalidraw format)
    let file_path = cache_dir.join("drawing-data.excalidraw");
    info!("Saving drawing to: {:?}", file_path);
    
    // Write the data to the file
    match fs::write(&file_path, &args.data) {
        Ok(_) => {
            info!("Drawing saved successfully to {:?}", file_path);
            // Verify the file was created
            if file_path.exists() {
                match fs::metadata(&file_path) {
                    Ok(metadata) => {
                        info!("File size: {} bytes", metadata.len());
                    },
                    Err(e) => {
                        error!("Failed to get file metadata: {}", e);
                    }
                }
            } else {
                error!("File was not created even though write appeared successful");
            }
            Ok(())
        },
        Err(e) => {
            error!("Failed to write drawing data: {}", e);
            Err(e.to_string())
        }
    }
}

// Command to load drawing data from a file
#[tauri::command]
fn load_drawing(app_handle: tauri::AppHandle) -> Result<String, String> {
    info!("Load drawing called");
    
    // Get the app data directory
    let app_data_dir = match app_data_dir(&app_handle.config()) {
        Some(dir) => dir,
        None => {
            error!("Failed to get app data directory");
            return Err("Failed to get app data directory".to_string());
        }
    };
    
    info!("App data directory: {:?}", app_data_dir);
    
    // Define the path for the drawing file
    let app_name = &app_handle.config().tauri.bundle.identifier;
    info!("App identifier: {}", app_name);
    
    let cache_dir = app_data_dir.join("cache").join(app_name);
    let file_path = cache_dir.join("drawing-data.excalidraw");
    info!("Looking for drawing at: {:?}", file_path);
    
    // Check if the file exists
    if !file_path.exists() {
        info!("No saved drawing found at {:?}", file_path);
        return Ok("".to_string()); // Return empty string if no saved data
    }
    
    // Read the data from the file
    info!("Loading drawing from: {:?}", file_path);
    match fs::read_to_string(&file_path) {
        Ok(data) => {
            info!("Drawing loaded successfully, data length: {}", data.len());
            Ok(data)
        },
        Err(e) => {
            error!("Failed to read drawing data: {}", e);
            Err(e.to_string())
        }
    }
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
            if app_data_dir.exists() {
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
            if cache_dir.exists() {
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
            if !app_cache_dir.exists() {
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
    
    info!("Storage path check results: {}", result);
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
