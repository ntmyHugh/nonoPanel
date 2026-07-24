use tauri::State;

use crate::smtc::controller::SmtcController;
use crate::state::AppState;

#[derive(Debug, serde::Deserialize, Clone)]
pub struct SmtcUpdatePayload {
    pub status: String,
    pub title: String,
    pub subtitle: String,
    #[serde(rename = "timeLeftSecs")]
    pub time_left_secs: f64,
    #[serde(rename = "totalTimeSecs")]
    pub total_time_secs: f64,
}

#[tauri::command]
pub fn smtc_update(
    app_handle: tauri::AppHandle,
    _state: State<'_, AppState>,
    payload: SmtcUpdatePayload,
) -> Result<(), String> {
    let controller = SmtcController::get_or_create(&app_handle)
        .map_err(|e| e.to_string())?;
    controller.update(payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn smtc_clear() -> Result<(), String> {
    SmtcController::clear().map_err(|e| e.to_string())
}

pub fn init_smtc(app_handle: &tauri::AppHandle) -> tauri::Result<()> {
    SmtcController::init(app_handle.clone());
    Ok(())
}
