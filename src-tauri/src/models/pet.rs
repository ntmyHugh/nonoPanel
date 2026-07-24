use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Full pet manifest returned to JS
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PetManifest {
    /// Parsed manifest.json entries
    pub entries: Vec<ManifestEntry>,
    /// Fallback: GIF files found by scanning directories, keyed by category
    pub fallback: HashMap<String, Vec<String>>,
    /// Contents of dialog.txt
    pub dialog_text: String,
}

/// Single entry from manifest.json
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestEntry {
    pub name: String,
    pub label: String,
    #[serde(rename = "sourceFolder")]
    pub source_folder: String,
    #[serde(rename = "relativePath")]
    pub relative_path: String,
    pub width: Option<f64>,
    pub height: Option<f64>,
    #[serde(rename = "frameCount", default)]
    pub frame_count: Option<u32>,
    #[serde(rename = "durationMs", default)]
    pub duration_ms: Option<u32>,
    #[serde(rename = "motionScore", default)]
    pub motion_score: Option<f64>,
    #[serde(rename = "opaqueRatio", default)]
    pub opaque_ratio: Option<f64>,
    #[serde(rename = "subjectRatio", default)]
    pub subject_ratio: Option<f64>,
    pub suggestion: Option<String>,
    #[serde(rename = "aiName", default)]
    pub ai_name: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub confidence: Option<f64>,
    #[serde(rename = "fineCategory", default)]
    pub fine_category: Option<String>,
    #[serde(rename = "fineLabel", default)]
    pub fine_label: Option<String>,
}
