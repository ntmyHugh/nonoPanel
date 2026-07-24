use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Weather API: {0}")]
    WeatherApi(String),

    #[error("Holiday API: {0}")]
    HolidayApi(String),

    #[error("IO: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON: {0}")]
    Json(#[from] serde_json::Error),

    #[error("HTTP: {0}")]
    Http(#[from] reqwest::Error),

    #[error("State lock poisoned")]
    StateLock,

    #[error("{0}")]
    Other(String),
}

impl From<AppError> for String {
    fn from(e: AppError) -> String {
        e.to_string()
    }
}
