use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde_json::Value;

use crate::models::config::AppConfig;

pub struct AppState {
    /// Structured configuration persisted to config.json
    pub config: Mutex<AppConfig>,
    /// Generic key-value store persisted to store.json
    pub store: Mutex<HashMap<String, Value>>,
    /// Resolved data directory for persistence
    pub data_dir: PathBuf,
    /// Resolved frontend resource directory (for asset scanning)
    pub resource_dir: PathBuf,
}
