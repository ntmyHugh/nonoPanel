use std::collections::HashMap;

use crate::error::AppError;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HolidayInfo {
    pub is_off_day: bool,
    pub name: String,
    pub date: String,
    pub target: String,
}

pub async fn fetch_holidays(year: u32) -> Result<HashMap<String, HolidayInfo>, AppError> {
    let url = format!(
        "https://timor.tech/api/holiday/year/{}/?t={}",
        year,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    let client = reqwest::Client::new();
    let resp = client.get(&url).send().await?;

    let status = resp.status();
    let body = resp.text().await?;

    if !status.is_success() {
        log::error!("Holiday API error [{}]: {}", status.as_u16(), &body);
        return Err(AppError::HolidayApi(format!(
            "HTTP {} from holiday API",
            status.as_u16()
        )));
    }

    log::info!("Holiday API response ({} bytes)", body.len());
    let raw: serde_json::Value = serde_json::from_str(&body).map_err(|e| {
        let preview: String = body.chars().take(200).collect();
        log::error!("Holiday JSON parse error: {} | body: {}", e, preview);
        AppError::Json(e)
    })?;

    if raw.get("code").and_then(|c| c.as_i64()) != Some(0) {
        return Err(AppError::HolidayApi("Invalid response".into()));
    }

    let holiday_map = raw
        .get("holiday")
        .and_then(|h| h.as_object())
        .ok_or(AppError::HolidayApi("No holiday data".into()))?;

    let mut result = HashMap::new();
    for (date, info) in holiday_map {
        let is_off_day = info.get("holiday").and_then(|v| v.as_bool()).unwrap_or(false);
        let name = info
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        result.insert(
            date.clone(),
            HolidayInfo {
                is_off_day: is_off_day && name != "补班",
                name: name.clone(),
                date: format!("{}-{}", year, date),
                target: info
                    .get("target")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
            },
        );
    }

    Ok(result)
}
