use serde::{Deserialize, Serialize};

/// City location from geo lookup
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CityLocation {
    pub id: String,
    pub name: String,
    pub adm: String,
}

/// Raw geo API response from QWeather
#[derive(Debug, Deserialize)]
pub struct GeoResponse {
    pub code: String,
    pub location: Option<Vec<GeoLocation>>,
}

#[derive(Debug, Deserialize)]
pub struct GeoLocation {
    pub id: String,
    pub name: String,
    pub adm1: String,
    pub adm2: Option<String>,
}

/// Current weather response
#[derive(Debug, Deserialize)]
pub struct NowResponse {
    pub code: String,
    pub now: Option<WeatherNow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeatherNow {
    pub temp: String,
    #[serde(rename = "feelsLike")]
    pub feels_like: String,
    pub icon: String,
    pub text: String,
    pub humidity: String,
    #[serde(rename = "windSpeed")]
    pub wind_speed: String,
    #[serde(rename = "windDir")]
    pub wind_dir: String,
    #[serde(rename = "windScale")]
    pub wind_scale: String,
    pub pressure: String,
    #[serde(rename = "obsTime")]
    pub obs_time: String,
    pub dew: Option<String>,
    pub vis: Option<String>,
}

/// Hourly forecast response
#[derive(Debug, Deserialize)]
pub struct HourlyResponse {
    pub code: String,
    pub hourly: Option<Vec<HourlyForecast>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HourlyForecast {
    #[serde(rename = "fxTime")]
    pub fx_time: String,
    pub temp: String,
    pub icon: String,
    pub pop: Option<String>,
    #[serde(rename = "windScale")]
    pub wind_scale: String,
}

/// Daily forecast response
#[derive(Debug, Deserialize)]
pub struct DailyResponse {
    pub code: String,
    pub daily: Option<Vec<DailyForecast>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyForecast {
    #[serde(rename = "fxDate")]
    pub fx_date: String,
    #[serde(rename = "tempMax")]
    pub temp_max: String,
    #[serde(rename = "tempMin")]
    pub temp_min: String,
    #[serde(rename = "iconDay")]
    pub icon_day: String,
    #[serde(rename = "textDay")]
    pub text_day: String,
    #[serde(rename = "textNight")]
    pub text_night: Option<String>,
    #[serde(rename = "windDirDay")]
    pub wind_dir_day: String,
    #[serde(rename = "windScaleDay")]
    pub wind_scale_day: String,
    #[serde(rename = "windDirNight")]
    pub wind_dir_night: Option<String>,
    #[serde(rename = "windScaleNight")]
    pub wind_scale_night: Option<String>,
}
