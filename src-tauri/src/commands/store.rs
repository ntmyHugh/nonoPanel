use std::collections::HashMap;

use serde_json::Value;
use tauri::State;

use crate::services;
use crate::state::AppState;

/// Get a value as a JSON string (backward-compatible).
#[tauri::command]
pub fn get_store_value(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let store = state.store.lock().map_err(|e| e.to_string())?;
    match store.get(&key) {
        Some(Value::String(s)) => Ok(Some(s.clone())),
        Some(v) => Ok(Some(v.to_string())),
        None => Ok(None),
    }
}

/// Set a plain string value (backward-compatible).
#[tauri::command]
pub fn set_store_value(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let mut store = state.store.lock().map_err(|e| e.to_string())?;
    store.insert(key, Value::String(value));
    flush_store(&state);
    Ok(())
}

/// Get a value as structured JSON.
#[tauri::command]
pub fn store_get_json(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<Value>, String> {
    let store = state.store.lock().map_err(|e| e.to_string())?;
    Ok(store.get(&key).cloned())
}

/// Set a structured JSON value (object, array, etc.).
#[tauri::command]
pub fn store_set_json(
    state: State<'_, AppState>,
    key: String,
    value: Value,
) -> Result<(), String> {
    let mut store = state.store.lock().map_err(|e| e.to_string())?;
    store.insert(key, value);
    flush_store(&state);
    Ok(())
}

/// Set multiple keys at once (for batch migration).
#[tauri::command]
pub fn store_set_batch(
    state: State<'_, AppState>,
    entries: HashMap<String, Value>,
) -> Result<(), String> {
    let mut store = state.store.lock().map_err(|e| e.to_string())?;
    for (k, v) in entries {
        store.insert(k, v);
    }
    flush_store(&state);
    Ok(())
}

/// Get all stored key-value pairs.
#[tauri::command]
pub fn store_get_all(
    state: State<'_, AppState>,
) -> Result<HashMap<String, Value>, String> {
    let store = state.store.lock().map_err(|e| e.to_string())?;
    Ok(store.clone())
}

/// Persist the in-memory store to store.json on disk.
fn flush_store(state: &State<'_, AppState>) {
    let store_path = state.data_dir.join("store.json");
    if let Ok(store) = state.store.lock() {
        let _ = services::persistence::save_json(&store_path, &*store);
    }
}
