use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::Value;

/// Load a JSON file into any deserializable type, returning default on failure.
pub fn load_json<T: DeserializeOwned + Default>(path: &Path) -> T {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

/// Load a flat key-value store from JSON file.
pub fn load_store(path: &Path) -> HashMap<String, Value> {
    load_json(path)
}

/// Save any serializable value to a JSON file (pretty-printed).
pub fn save_json(path: &Path, data: &impl Serialize) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(data)?;
    fs::write(path, json)
}
