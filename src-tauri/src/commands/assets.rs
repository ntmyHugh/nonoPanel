use std::collections::HashMap;
use std::fs;

use tauri::State;

use crate::models::pet::{ManifestEntry, PetManifest};
use crate::state::AppState;

const CATEGORIES: &[&str] = &["normal", "click", "sleep", "special", "walk"];

#[tauri::command]
pub fn assets_scan_pet_dir(state: State<'_, AppState>) -> Result<PetManifest, String> {
    let pet_dir = state.resource_dir.join("assets").join("pet");

    // 1. Try to read manifest.json
    let entries: Vec<ManifestEntry> = fs::read_to_string(pet_dir.join("manifest.json"))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    // 2. Scan fallback: list .gif files in each category subdirectory
    let mut fallback: HashMap<String, Vec<String>> = HashMap::new();

    for label in CATEGORIES {
        let subdir = pet_dir.join(label);
        if !subdir.exists() {
            continue;
        }

        let mut files: Vec<String> = fs::read_dir(&subdir)
            .map_err(|e| e.to_string())?
            .filter_map(|entry| entry.ok())
            .filter(|e| {
                e.path()
                    .extension()
                    .map_or(false, |ext| ext.eq_ignore_ascii_case("gif"))
            })
            .map(|e| {
                format!(
                    "assets/pet/{}/{}",
                    label,
                    e.file_name().to_string_lossy()
                )
            })
            .collect();
        files.sort();
        fallback.insert(label.to_string(), files);
    }

    // 3. Try to read dialog.txt
    let dialog_text =
        fs::read_to_string(pet_dir.join("dialog.txt")).unwrap_or_default();

    Ok(PetManifest {
        entries,
        fallback,
        dialog_text,
    })
}
