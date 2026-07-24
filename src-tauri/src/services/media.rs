use std::collections::HashMap;
use std::sync::Mutex;

use serde::Serialize;
use tokio::sync::mpsc;
use tokio::time::{interval, Duration, MissedTickBehavior};

use tauri::Emitter;

// ── Types ──

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub status: String,        // "playing" | "paused" | "stopped" | "closed"
    pub position_secs: f64,
    pub duration_secs: f64,
    pub can_play: bool,
    pub can_pause: bool,
    pub can_next: bool,
    pub can_prev: bool,
    pub app_name: String,
    pub song_id: String,       // title + artist hash for lyrics lookup
    pub thumbnail_base64: String,
}

impl Default for MediaState {
    fn default() -> Self {
        Self {
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            status: "closed".into(),
            position_secs: 0.0,
            duration_secs: 0.0,
            can_play: false,
            can_pause: false,
            can_next: false,
            can_prev: false,
            app_name: String::new(),
            song_id: String::new(),
            thumbnail_base64: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine {
    pub time_ms: u64,
    pub text: String,
}

pub enum MediaCommand {
    Play,
    Pause,
    TogglePlayPause,
    Next,
    Previous,
}

// ── Shared state ──

pub static LAST_STATE: std::sync::LazyLock<Mutex<MediaState>> =
    std::sync::LazyLock::new(|| Mutex::new(MediaState::default()));

static COMMAND_TX: std::sync::LazyLock<Mutex<Option<mpsc::UnboundedSender<MediaCommand>>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

// ── Lyrics cache ──

static LYRICS_CACHE: std::sync::LazyLock<Mutex<HashMap<String, Vec<LyricLine>>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

// ── Public API ──

pub fn send_command(cmd: MediaCommand) {
    if let Ok(guard) = COMMAND_TX.lock() {
        if let Some(tx) = guard.as_ref() {
            let _ = tx.send(cmd);
        }
    }
}

pub fn get_last_state() -> MediaState {
    LAST_STATE.lock().map(|g| g.clone()).unwrap_or_default()
}

pub fn get_cached_lyrics(song_id: &str) -> Option<Vec<LyricLine>> {
    LYRICS_CACHE
        .lock()
        .ok()
        .and_then(|g| g.get(song_id).cloned())
}

/// Start the media controller background task.
/// Only compiles on Windows (GSMTC is Windows-only).
#[cfg(target_os = "windows")]
pub fn start_media_controller(app_handle: tauri::AppHandle) {
    let (cmd_tx, mut cmd_rx) = mpsc::unbounded_channel::<MediaCommand>();

    if let Ok(mut guard) = COMMAND_TX.lock() {
        *guard = Some(cmd_tx);
    }

    tauri::async_runtime::spawn(async move {
        let handle = app_handle.clone();
        let mut last_song_id = String::new();
        let mut ticker = interval(Duration::from_millis(250));
        ticker.set_missed_tick_behavior(MissedTickBehavior::Delay);

        loop {
            ticker.tick().await;

            // Poll GSMTC
            let state = poll_gsmtc().await;

            let song_changed = !state.song_id.is_empty() && state.song_id != last_song_id;
            if song_changed {
                last_song_id = state.song_id.clone();
                // Fetch lyrics in background
                let sid = state.song_id.clone();
                let t = state.title.clone();
                let a = state.artist.clone();
                let h = handle.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(lyrics) = fetch_and_cache_lyrics(&sid, &t, &a).await {
                        let _ = h.emit("media:lyrics", &lyrics);
                    }
                });
            }

            // Emit state to frontend
            {
                if let Ok(mut guard) = LAST_STATE.lock() {
                    *guard = state.clone();
                }
                let _ = handle.emit("media:state", &state);
            }

            // Handle commands (non-blocking poll)
            while let Ok(cmd) = cmd_rx.try_recv() {
                handle_media_command(&cmd).await;
            }

        }
    });
}

#[cfg(not(target_os = "windows"))]
pub fn start_media_controller(_app_handle: tauri::AppHandle) {
    // No-op on non-Windows
}

// ── Windows GSMTC implementation ──

#[cfg(target_os = "windows")]
async fn poll_gsmtc() -> MediaState {
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };

    let mut state = MediaState::default();

    // Get the session manager
    let op = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        Ok(op) => op,
        Err(_) => return state,
    };

    let manager = match op.get() {
        Ok(m) => m,
        Err(_) => return state,
    };

    let session = match manager.GetCurrentSession() {
        Ok(s) => s,
        Err(_) => return state,
    };

    // App name
    if let Ok(name) = session.SourceAppUserModelId() {
        state.app_name = simplify_app_name(&name.to_string());
    }

    // Timeline
    if let Ok(timeline) = session.GetTimelineProperties() {
        if let Ok(pos) = timeline.Position() {
            state.position_secs = (pos.Duration as f64) / 10_000_000.0;
        }
        if let Ok(end) = timeline.EndTime() {
            state.duration_secs = (end.Duration as f64) / 10_000_000.0;
        }
    }

    // Playback info
    if let Ok(info) = session.GetPlaybackInfo() {
        if let Ok(controls) = info.Controls() {
            state.can_play = controls.IsPlayEnabled().unwrap_or(false);
            state.can_pause = controls.IsPauseEnabled().unwrap_or(false);
            state.can_next = controls.IsNextEnabled().unwrap_or(false);
            state.can_prev = controls.IsPreviousEnabled().unwrap_or(false);
        }
        if let Ok(status) = info.PlaybackStatus() {
            state.status = match status {
                GlobalSystemMediaTransportControlsSessionPlaybackStatus(4) => "playing",
                GlobalSystemMediaTransportControlsSessionPlaybackStatus(5) => "paused",
                GlobalSystemMediaTransportControlsSessionPlaybackStatus(3) => "stopped",
                _ => "closed",
            }
            .into();
        }
    }

    // Media properties (title, artist, album)
    if let Ok(props_op) = session.TryGetMediaPropertiesAsync() {
        if let Ok(props) = props_op.get() {
            state.title = props.Title().map(|t| t.to_string()).unwrap_or_default();
            state.artist = props.Artist().map(|a| a.to_string()).unwrap_or_default();
            state.album = props.AlbumTitle().map(|a| a.to_string()).unwrap_or_default();
        }
    }

    // Album art thumbnail
    if let Ok(props_op) = session.TryGetMediaPropertiesAsync() {
        if let Ok(props) = props_op.get() {
            if let Ok(thumbnail) = props.Thumbnail() {
                state.thumbnail_base64 = extract_thumbnail_base64(&thumbnail).unwrap_or_default();
            }
        }
    }

    // Build song_id for lyrics caching
    if !state.title.is_empty() {
        state.song_id = format!("{}|{}", state.title, state.artist);
    }

    state
}

#[cfg(target_os = "windows")]
async fn handle_media_command(cmd: &MediaCommand) {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    let op = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        Ok(op) => op,
        Err(_) => return,
    };

    let manager = match op.get() {
        Ok(m) => m,
        Err(_) => return,
    };

    let session = match manager.GetCurrentSession() {
        Ok(s) => s,
        Err(_) => return,
    };

    let _ = match cmd {
        MediaCommand::Play => session.TryPlayAsync().and_then(|op| op.get()).ok(),
        MediaCommand::Pause => session.TryPauseAsync().and_then(|op| op.get()).ok(),
        MediaCommand::TogglePlayPause => {
            session.TryTogglePlayPauseAsync().and_then(|op| op.get()).ok()
        }
        MediaCommand::Next => session.TrySkipNextAsync().and_then(|op| op.get()).ok(),
        MediaCommand::Previous => session.TrySkipPreviousAsync().and_then(|op| op.get()).ok(),
    };
}

// ── Lyrics ──

async fn fetch_and_cache_lyrics(
    song_id: &str,
    title: &str,
    artist: &str,
) -> Option<Vec<LyricLine>> {
    // Check cache first
    if let Some(cached) = get_cached_lyrics(song_id) {
        return Some(cached);
    }

    let lyrics = fetch_lyrics_netease(title, artist).await?;

    // Cache it
    if let Ok(mut guard) = LYRICS_CACHE.lock() {
        guard.insert(song_id.to_string(), lyrics.clone());
    }

    Some(lyrics)
}

async fn fetch_lyrics_netease(title: &str, artist: &str) -> Option<Vec<LyricLine>> {
    let client = reqwest::Client::new();

    // Step 1: Search for the song
    let search_url = format!(
        "https://music.163.com/api/search/get?s={}+{}&type=1&limit=3",
        urlencoding(title),
        urlencoding(artist)
    );

    let search_resp = client
        .get(&search_url)
        .header("User-Agent", "Mozilla/5.0")
        .header("Referer", "https://music.163.com")
        .send()
        .await
        .ok()?;

    let search_json: serde_json::Value = search_resp.json().await.ok()?;
    let songs = search_json
        .get("result")?
        .get("songs")?
        .as_array()?;

    if songs.is_empty() {
        return None;
    }

    // Try each song until we find lyrics
    for song in songs {
        let song_id = song.get("id")?.as_i64()?;

        let lyric_url = format!(
            "https://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1",
            song_id
        );

        let lyric_resp = client
            .get(&lyric_url)
            .header("User-Agent", "Mozilla/5.0")
            .header("Referer", "https://music.163.com")
            .send()
            .await
            .ok()?;

        let lyric_json: serde_json::Value = lyric_resp.json().await.ok()?;

        // Try to get the main lyric
        if let Some(lrc) = lyric_json.get("lrc").and_then(|l| l.get("lyric")).and_then(|l| l.as_str()) {
            if !lrc.is_empty() {
                return Some(parse_lrc(lrc));
            }
        }
    }

    None
}

fn parse_lrc(lrc_text: &str) -> Vec<LyricLine> {
    let mut lines: Vec<LyricLine> = Vec::new();

    for line in lrc_text.lines() {
        let line = line.trim();
        if !line.starts_with('[') {
            continue;
        }

        // Parse [mm:ss.xx]text
        if let Some(bracket_end) = line.find(']') {
            let time_str = &line[1..bracket_end];
            let text = line[bracket_end + 1..].trim().to_string();

            if text.is_empty() {
                continue;
            }

            // Parse mm:ss.xx or mm:ss.xxx
            let parts: Vec<&str> = time_str.split(':').collect();
            if parts.len() != 2 {
                continue;
            }

            let min: u64 = parts[0].parse().unwrap_or(0);
            let sec_parts: Vec<&str> = parts[1].split('.').collect();
            let sec: u64 = sec_parts.first().and_then(|s| s.parse().ok()).unwrap_or(0);
            let ms_str = sec_parts.get(1).unwrap_or(&"0");
            // Pad or truncate to 2 digits (centiseconds → milliseconds)
            let ms: u64 = if ms_str.len() >= 3 {
                ms_str[..3].parse().unwrap_or(0)
            } else if ms_str.len() == 2 {
                ms_str.parse::<u64>().unwrap_or(0) * 10
            } else {
                ms_str.parse::<u64>().unwrap_or(0) * 100
            };

            let time_ms = min * 60_000 + sec * 1_000 + ms;
            lines.push(LyricLine { time_ms, text });
        }
    }

    lines.sort_by_key(|l| l.time_ms);
    lines
}

fn urlencoding(s: &str) -> String {
    let mut result = String::with_capacity(s.len() * 3);
    for byte in s.as_bytes() {
        match *byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(*byte as char);
            }
            _ => {
                result.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    result
}

#[cfg(target_os = "windows")]
fn extract_thumbnail_base64(
    thumbnail: &windows::Storage::Streams::IRandomAccessStreamReference,
) -> Result<String, Box<dyn std::error::Error>> {
    use windows::Storage::Streams::{Buffer, InputStreamOptions};
    use windows::core::Interface;
    use windows::Win32::System::WinRT::IBufferByteAccess;

    // Open the stream
    let stream_op = thumbnail.OpenReadAsync()?;
    let stream = stream_op.get()?;

    // Get stream size
    let size = stream.Size()?;
    if size == 0 || size > 512 * 1024 {
        // Skip if empty or >512KB (too large for base64 in events)
        return Ok(String::new());
    }

    // Read into buffer
    let buffer = Buffer::Create(size as u32)?;
    let read_op = stream.ReadAsync(&buffer, size as u32, InputStreamOptions::None)?;
    read_op.get()?;

    // Extract raw bytes via IBufferByteAccess
    let byte_access: IBufferByteAccess = buffer.cast()?;
    let ptr = unsafe { byte_access.Buffer()? };
    let length = buffer.Length()? as usize;
    let bytes = unsafe { std::slice::from_raw_parts(ptr, length) };

    Ok(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, bytes))
}

#[cfg(not(target_os = "windows"))]
fn extract_thumbnail_base64(
    _thumbnail: &(), // dummy
) -> Result<String, Box<dyn std::error::Error>> {
    Ok(String::new())
}

#[cfg(target_os = "windows")]
fn simplify_app_name(raw: &str) -> String {
    // Extract readable name from AppUserModelId like "AppleInc.AppleMusicWin_..."
    raw.split('.').last().unwrap_or(raw).to_string()
}
