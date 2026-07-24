use crate::services::media::{self, MediaCommand, MediaState};

#[tauri::command]
pub fn media_command(action: String) -> Result<(), String> {
    let cmd = match action.as_str() {
        "play" => MediaCommand::Play,
        "pause" => MediaCommand::Pause,
        "toggle" => MediaCommand::TogglePlayPause,
        "next" => MediaCommand::Next,
        "previous" => MediaCommand::Previous,
        _ => return Err(format!("Unknown action: {}", action)),
    };
    media::send_command(cmd);
    Ok(())
}

#[tauri::command]
pub fn media_get_state() -> Result<MediaState, String> {
    Ok(media::get_last_state())
}
