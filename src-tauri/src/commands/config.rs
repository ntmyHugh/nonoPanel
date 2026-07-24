use tauri::State;

use crate::models::config::{AppConfig, CityConfig};
use crate::services;
use crate::state::AppState;

#[tauri::command]
pub fn config_get_all(state: State<'_, AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn config_set_weather_cities(
    state: State<'_, AppState>,
    main_city: Option<CityConfig>,
    secondary_city: Option<CityConfig>,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.main_city = main_city;
    config.secondary_city = secondary_city;
    flush_config(&state);
    Ok(())
}

#[tauri::command]
pub fn config_set_theme(
    state: State<'_, AppState>,
    theme: String,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.theme = theme;
    flush_config(&state);
    Ok(())
}

fn flush_config(state: &State<'_, AppState>) {
    let config_path = state.data_dir.join("config.json");
    if let Ok(config) = state.config.lock() {
        let _ = services::persistence::save_json(&config_path, &*config);
    }
}
