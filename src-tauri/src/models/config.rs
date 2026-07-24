use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_theme")]
    pub theme: String,

    #[serde(default)]
    pub main_city: Option<CityConfig>,

    #[serde(default)]
    pub secondary_city: Option<CityConfig>,

    #[serde(default = "default_current_city")]
    pub current_city: String,

    #[serde(default = "default_true")]
    pub first_run: bool,
}

fn default_theme() -> String {
    "dark".into()
}

fn default_current_city() -> String {
    "main".into()
}

fn default_true() -> bool {
    true
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            main_city: None,
            secondary_city: None,
            current_city: default_current_city(),
            first_run: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityConfig {
    pub id: String,
    pub name: String,
    pub adm: Option<String>,
}
