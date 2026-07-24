use std::collections::HashMap;

use tauri::State;

use crate::models::weather::*;
use crate::services::holiday::HolidayInfo;
use crate::services::weather::WeatherClient;

#[tauri::command]
pub async fn weather_search_city(
    weather: State<'_, WeatherClient>,
    city: String,
    adm: Option<String>,
) -> Result<CityLocation, String> {
    weather
        .geo_lookup(&city, adm.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn weather_get_current(
    weather: State<'_, WeatherClient>,
    location_id: String,
) -> Result<WeatherNow, String> {
    weather
        .current_weather(&location_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn weather_get_hourly(
    weather: State<'_, WeatherClient>,
    location_id: String,
) -> Result<Vec<HourlyForecast>, String> {
    weather
        .hourly_forecast(&location_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn weather_get_daily(
    weather: State<'_, WeatherClient>,
    location_id: String,
) -> Result<Vec<DailyForecast>, String> {
    weather
        .daily_forecast(&location_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn holiday_get_year(
    year: u32,
) -> Result<HashMap<String, HolidayInfo>, String> {
    crate::services::holiday::fetch_holidays(year)
        .await
        .map_err(|e| e.to_string())
}
