use std::collections::HashMap;
use std::time::{Duration, Instant};

use reqwest::Client;
use tokio::sync::Mutex;

use crate::error::AppError;
use crate::models::weather::*;

// Embed QWEATHER_API_KEY at compile time via env var
// Set before building: set QWEATHER_API_KEY=your_key && cargo build
fn api_key() -> &'static str {
    option_env!("QWEATHER_API_KEY").unwrap_or("")
}
const BASE_URL: &str = "https://ph3jpfvumh.re.qweatherapi.com";

const TTL_NOW: Duration = Duration::from_secs(15 * 60);
const TTL_FORECAST: Duration = Duration::from_secs(30 * 60);
const TTL_GEO: Duration = Duration::from_secs(24 * 60 * 60);

struct CacheEntry {
    data: String,
    expires_at: Instant,
}

pub struct WeatherClient {
    http: Client,
    cache: Mutex<HashMap<String, CacheEntry>>,
}

impl WeatherClient {
    pub fn new() -> Self {
        Self {
            http: Client::new(),
            cache: Mutex::new(HashMap::new()),
        }
    }

    async fn cache_get(&self, key: &str, _ttl: Duration) -> Option<String> {
        let guard = self.cache.lock().await;
        guard.get(key).and_then(|e| {
            if Instant::now() < e.expires_at {
                Some(e.data.clone())
            } else {
                None
            }
        })
    }

    async fn cache_set(&self, key: String, data: String, ttl: Duration) {
        let mut guard = self.cache.lock().await;
        guard.insert(
            key,
            CacheEntry {
                data,
                expires_at: Instant::now() + ttl,
            },
        );
    }

    async fn api_get(&self, path: &str, params: &[(&str, &str)]) -> Result<String, AppError> {
        let mut url = reqwest::Url::parse(BASE_URL).unwrap().join(path).unwrap();
        {
            let mut q = url.query_pairs_mut();
            q.append_pair("key", &api_key());
            q.append_pair("lang", "zh");
            q.append_pair("unit", "m");
            for (k, v) in params {
                q.append_pair(k, v);
            }
        }

        // Strip key from log for safety
        let safe_url = url.as_str().replace(api_key(), "***");
        log::info!("QWeather GET {}", safe_url);

        let resp = self
            .http
            .get(url.clone())
            .header("Accept", "application/json")
            .header("User-Agent", "pannel-tauri/1.0")
            .send()
            .await?;

        let status = resp.status();
        let headers = resp.headers().clone();
        let body = resp.text().await?;

        log::info!(
            "QWeather response [{}] {}: {} bytes, content-type: {:?}",
            status.as_u16(),
            path,
            body.len(),
            headers.get("content-type")
        );

        if !status.is_success() {
            log::info!("QWeather API error [{}] {}: {}", status.as_u16(), path, &body);
            return Err(AppError::WeatherApi(format!(
                "HTTP {} from weather API",
                status.as_u16()
            )));
        }

        // Log truncated body for debugging
        let preview: String = body.chars().take(200).collect();
        log::info!("QWeather [{}] -> {}", path, preview);

        Ok(body)
    }

    pub async fn geo_lookup(
        &self,
        city: &str,
        adm: Option<&str>,
    ) -> Result<CityLocation, AppError> {
        let cache_key = format!("geo_{}_{}", city, adm.unwrap_or(""));

        if let Some(cached) = self.cache_get(&cache_key, TTL_GEO).await {
            return serde_json::from_str(&cached).map_err(AppError::Json);
        }

        let mut params = vec![("location", city)];
        if let Some(a) = adm {
            params.push(("adm", a));
        }

        let body = self.api_get("/geo/v2/city/lookup", &params).await?;
        let resp: GeoResponse = serde_json::from_str(&body).map_err(|e| {
            let preview: String = body.chars().take(300).collect();
            log::info!("Geo JSON parse error: {} | body: {}", e, preview);
            AppError::Json(e)
        })?;

        if resp.code != "200" || resp.location.is_none() {
            return Err(AppError::WeatherApi("City not found".into()));
        }

        let loc = &resp.location.as_ref().unwrap()[0];
        let result = CityLocation {
            id: loc.id.clone(),
            name: loc.name.clone(),
            adm: loc.adm1.clone(),
        };

        let cached_json = serde_json::to_string(&result)?;
        self.cache_set(cache_key, cached_json, TTL_GEO).await;

        Ok(result)
    }

    pub async fn current_weather(&self, location_id: &str) -> Result<WeatherNow, AppError> {
        let cache_key = format!("now_{}", location_id);

        if let Some(cached) = self.cache_get(&cache_key, TTL_NOW).await {
            return serde_json::from_str(&cached).map_err(AppError::Json);
        }

        let body = self
            .api_get("/v7/weather/now", &[("location", location_id)])
            .await?;
        let resp: NowResponse = serde_json::from_str(&body).map_err(|e| {
            let preview: String = body.chars().take(300).collect();
            log::info!("Now JSON parse error: {} | body: {}", e, preview);
            AppError::Json(e)
        })?;

        if resp.code != "200" {
            return Err(AppError::WeatherApi(format!("API code: {}", resp.code)));
        }

        let now = resp.now.ok_or(AppError::WeatherApi("No now data".into()))?;
        let cached_json = serde_json::to_string(&now)?;
        self.cache_set(cache_key, cached_json, TTL_NOW).await;

        Ok(now)
    }

    pub async fn hourly_forecast(
        &self,
        location_id: &str,
    ) -> Result<Vec<HourlyForecast>, AppError> {
        let cache_key = format!("hourly_{}", location_id);

        if let Some(cached) = self.cache_get(&cache_key, TTL_FORECAST).await {
            return serde_json::from_str(&cached).map_err(AppError::Json);
        }

        let body = self
            .api_get("/v7/weather/24h", &[("location", location_id)])
            .await?;
        let resp: HourlyResponse = serde_json::from_str(&body)?;

        if resp.code != "200" {
            return Err(AppError::WeatherApi(format!("API code: {}", resp.code)));
        }

        let hourly = resp
            .hourly
            .ok_or(AppError::WeatherApi("No hourly data".into()))?;
        let cached_json = serde_json::to_string(&hourly)?;
        self.cache_set(cache_key, cached_json, TTL_FORECAST).await;

        Ok(hourly)
    }

    pub async fn daily_forecast(
        &self,
        location_id: &str,
    ) -> Result<Vec<DailyForecast>, AppError> {
        let cache_key = format!("daily_{}", location_id);

        if let Some(cached) = self.cache_get(&cache_key, TTL_FORECAST).await {
            return serde_json::from_str(&cached).map_err(AppError::Json);
        }

        let body = self
            .api_get("/v7/weather/7d", &[("location", location_id)])
            .await?;
        let resp: DailyResponse = serde_json::from_str(&body)?;

        if resp.code != "200" {
            return Err(AppError::WeatherApi(format!("API code: {}", resp.code)));
        }

        let daily = resp
            .daily
            .ok_or(AppError::WeatherApi("No daily data".into()))?;
        let cached_json = serde_json::to_string(&daily)?;
        self.cache_set(cache_key, cached_json, TTL_FORECAST).await;

        Ok(daily)
    }
}
