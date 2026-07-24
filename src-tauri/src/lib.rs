mod commands;
mod error;
mod models;
mod services;
mod smtc;
mod state;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Resolve data directory: %APPDATA%/com.pannel.dashboard
    let data_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.nono.panel");

    // Resolve resource directory from the frontend dist location.
    // In dev mode the frontendDist is "../src" relative to src-tauri.
    let resource_dir = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .parent()
        .map(|p| p.join("src"))
        .unwrap_or_else(|| PathBuf::from("../src"));

    let app_state = AppState {
        config: Mutex::new(Default::default()),
        store: Mutex::new(HashMap::new()),
        data_dir: data_dir.clone(),
        resource_dir,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(app_state)
        .manage(services::weather::WeatherClient::new())
        .setup(move |app| {
            // Load persisted config and store from disk
            let state = app.state::<AppState>();
            let config_path = data_dir.join("config.json");
            let store_path = data_dir.join("store.json");

            if let Ok(mut config) = state.config.lock() {
                *config = services::persistence::load_json(&config_path);
            }
            if let Ok(mut store) = state.store.lock() {
                *store = services::persistence::load_store(&store_path);
            }

            // Initialize system tray (Windows)
            #[cfg(target_os = "windows")]
            commands::tray::init_tray(app.handle())?;

            // Initialize SMTC controller (Windows)
            commands::smtc::init_smtc(app.handle())?;

            // Start media controller (Windows GSMTC polling)
            services::media::start_media_controller(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::smtc::smtc_update,
            commands::smtc::smtc_clear,
            commands::notification::send_notification,
            commands::store::get_store_value,
            commands::store::set_store_value,
            commands::store::store_get_json,
            commands::store::store_set_json,
            commands::store::store_set_batch,
            commands::store::store_get_all,
            commands::weather::weather_search_city,
            commands::weather::weather_get_current,
            commands::weather::weather_get_hourly,
            commands::weather::weather_get_daily,
            commands::assets::assets_scan_pet_dir,
            commands::config::config_get_all,
            commands::config::config_set_weather_cities,
            commands::config::config_set_theme,
            commands::weather::holiday_get_year,
            commands::media::media_command,
            commands::media::media_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
