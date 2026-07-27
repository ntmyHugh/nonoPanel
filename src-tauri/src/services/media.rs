use std::sync::Mutex;

use serde::Serialize;
use tokio::sync::mpsc;
use tokio::time::{interval, Duration, MissedTickBehavior};

use tauri::Emitter;

#[cfg(target_os = "windows")]
use windows::{
    Foundation::{EventRegistrationToken, TypedEventHandler},
    Media::Control::{
        CurrentSessionChangedEventArgs,
        GlobalSystemMediaTransportControlsSession,
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionMediaProperties,
        GlobalSystemMediaTransportControlsSessionPlaybackInfo,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
        GlobalSystemMediaTransportControlsSessionTimelineProperties,
        MediaPropertiesChangedEventArgs,
        PlaybackInfoChangedEventArgs,
        SessionsChangedEventArgs,
        TimelinePropertiesChangedEventArgs,
    },
};

// ── Types ──

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub status: String,
    pub position_secs: f64,
    pub duration_secs: f64,
    pub can_play: bool,
    pub can_pause: bool,
    pub can_next: bool,
    pub can_prev: bool,
    pub app_name: String,
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
            thumbnail_base64: String::new(),
        }
    }
}

pub enum MediaCommand {
    Play,
    Pause,
    TogglePlayPause,
    Next,
    Previous,
}

#[cfg(target_os = "windows")]
#[derive(Clone, Copy)]
enum MediaEvent {
    SessionChanged,
    PlaybackChanged,
    MediaPropertiesChanged,
    TimelineChanged,
}

#[cfg(target_os = "windows")]
struct ManagerRegistration {
    manager: GlobalSystemMediaTransportControlsSessionManager,
    _current_session_token: EventRegistrationToken,
    _sessions_changed_token: EventRegistrationToken,
}

#[cfg(target_os = "windows")]
struct ActiveSessionRegistration {
    id: String,
    session: GlobalSystemMediaTransportControlsSession,
    playback_token: EventRegistrationToken,
    media_token: EventRegistrationToken,
    timeline_token: EventRegistrationToken,
}

// ── Shared state ──

pub static LAST_STATE: std::sync::LazyLock<Mutex<MediaState>> =
    std::sync::LazyLock::new(|| Mutex::new(MediaState::default()));

static COMMAND_TX: std::sync::LazyLock<Mutex<Option<mpsc::UnboundedSender<MediaCommand>>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

#[cfg(target_os = "windows")]
static EVENT_TX: std::sync::LazyLock<Mutex<Option<mpsc::UnboundedSender<MediaEvent>>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

#[cfg(target_os = "windows")]
static GSMTC_MANAGER: std::sync::LazyLock<Mutex<Option<ManagerRegistration>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

#[cfg(target_os = "windows")]
static ACTIVE_SESSION: std::sync::LazyLock<Mutex<Option<ActiveSessionRegistration>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

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

/// Start the media controller.
/// Uses GSMTC events for state changes and a lightweight timer for playback progress.
#[cfg(target_os = "windows")]
pub fn start_media_controller(app_handle: tauri::AppHandle) {
    let (cmd_tx, mut cmd_rx) = mpsc::unbounded_channel::<MediaCommand>();
    if let Ok(mut guard) = COMMAND_TX.lock() {
        *guard = Some(cmd_tx);
    }

    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<MediaEvent>();
    if let Ok(mut guard) = EVENT_TX.lock() {
        *guard = Some(event_tx);
    }

    if let Err(err) = ensure_runtime_ready() {
        log::warn!("Failed to initialize GSMTC runtime: {err}");
    }

    tauri::async_runtime::spawn(async move {
        let handle = app_handle.clone();
        let mut ticker = interval(Duration::from_secs(1));
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

        emit_full_state(&handle);

        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    if should_refresh_timeline() {
                        emit_timeline_update(&handle);
                    }
                }
                event = event_rx.recv() => {
                    match event {
                        Some(MediaEvent::SessionChanged) => {
                            if let Err(err) = refresh_active_session_subscription() {
                                log::warn!("Failed to refresh active media session: {err}");
                            }
                            emit_full_state(&handle);
                        }
                        Some(MediaEvent::PlaybackChanged) => emit_playback_update(&handle),
                        Some(MediaEvent::MediaPropertiesChanged) => emit_media_properties_update(&handle),
                        Some(MediaEvent::TimelineChanged) => emit_timeline_update(&handle),
                        None => break,
                    }
                }
                cmd = cmd_rx.recv() => {
                    if let Some(cmd) = cmd {
                        optimistic_emit(&handle, &cmd);
                        tokio::spawn(async move {
                            handle_media_command(&cmd);
                        });
                    } else {
                        break;
                    }
                }
            }
        }
    });
}

#[cfg(not(target_os = "windows"))]
pub fn start_media_controller(_app_handle: tauri::AppHandle) {}

// ── Optimistic emit ──

#[cfg(target_os = "windows")]
fn optimistic_emit(handle: &tauri::AppHandle, cmd: &MediaCommand) {
    if let Ok(mut guard) = LAST_STATE.lock() {
        let new_status = match cmd {
            MediaCommand::Play => "playing",
            MediaCommand::Pause => "paused",
            MediaCommand::TogglePlayPause => {
                if guard.status == "playing" {
                    "paused"
                } else {
                    "playing"
                }
            }
            _ => return,
        };
        guard.status = new_status.to_string();
        let _ = handle.emit("media:state", &guard.clone());
    }
}

// ── Event-driven state updates ──

#[cfg(target_os = "windows")]
fn emit_full_state(handle: &tauri::AppHandle) {
    let state = current_session_state(true).unwrap_or_default();
    store_and_emit(handle, state);
}

#[cfg(target_os = "windows")]
fn emit_playback_update(handle: &tauri::AppHandle) {
    let Some(session) = get_or_refresh_active_session() else {
        store_and_emit(handle, MediaState::default());
        return;
    };

    let mut state = get_last_state();
    if let Ok(info) = session.GetPlaybackInfo() {
        apply_playback_info(&mut state, &info);
        store_and_emit(handle, state);
    } else {
        emit_full_state(handle);
    }
}

#[cfg(target_os = "windows")]
fn emit_media_properties_update(handle: &tauri::AppHandle) {
    let Some(session) = get_or_refresh_active_session() else {
        store_and_emit(handle, MediaState::default());
        return;
    };

    let mut state = get_last_state();
    apply_app_name(&mut state, &session);
    match session.TryGetMediaPropertiesAsync().and_then(|op| op.get()) {
        Ok(props) => {
            apply_media_properties(&mut state, &props);
            store_and_emit(handle, state);
        }
        Err(_) => emit_full_state(handle),
    }
}

#[cfg(target_os = "windows")]
fn emit_timeline_update(handle: &tauri::AppHandle) {
    let Some(session) = get_or_refresh_active_session() else {
        store_and_emit(handle, MediaState::default());
        return;
    };

    let mut state = get_last_state();
    match session.GetTimelineProperties() {
        Ok(timeline) => {
            apply_timeline(&mut state, &timeline);
            store_and_emit(handle, state);
        }
        Err(_) => emit_full_state(handle),
    }
}

// ── Runtime setup ──

#[cfg(target_os = "windows")]
fn ensure_runtime_ready() -> Result<(), Box<dyn std::error::Error>> {
    ensure_manager()?;
    let _ = refresh_active_session_subscription()?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn ensure_manager(
) -> Result<GlobalSystemMediaTransportControlsSessionManager, Box<dyn std::error::Error>> {
    if let Ok(guard) = GSMTC_MANAGER.lock() {
        if let Some(registration) = guard.as_ref() {
            return Ok(registration.manager.clone());
        }
    }

    let event_tx = EVENT_TX
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().cloned())
        .ok_or_else(|| std::io::Error::other("media event channel unavailable"))?;

    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()?.get()?;

    let session_tx = event_tx.clone();
    let current_session_token = manager.CurrentSessionChanged(&TypedEventHandler::<
        GlobalSystemMediaTransportControlsSessionManager,
        CurrentSessionChangedEventArgs,
    >::new(move |_, _| {
        let _ = session_tx.send(MediaEvent::SessionChanged);
        Ok(())
    }))?;

    let sessions_tx = event_tx;
    let sessions_changed_token = manager.SessionsChanged(&TypedEventHandler::<
        GlobalSystemMediaTransportControlsSessionManager,
        SessionsChangedEventArgs,
    >::new(move |_, _| {
        let _ = sessions_tx.send(MediaEvent::SessionChanged);
        Ok(())
    }))?;

    if let Ok(mut guard) = GSMTC_MANAGER.lock() {
        *guard = Some(ManagerRegistration {
            manager: manager.clone(),
            _current_session_token: current_session_token,
            _sessions_changed_token: sessions_changed_token,
        });
    }

    Ok(manager)
}

#[cfg(target_os = "windows")]
fn refresh_active_session_subscription(
) -> Result<Option<GlobalSystemMediaTransportControlsSession>, Box<dyn std::error::Error>> {
    let manager = ensure_manager()?;
    let next_session = match manager.GetCurrentSession() {
        Ok(session) => session,
        Err(_) => {
            unsubscribe_active_session();
            return Ok(None);
        }
    };

    let next_id = session_id(&next_session);
    let current_id = ACTIVE_SESSION
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|registration| registration.id.clone()));

    if current_id.as_deref() == Some(next_id.as_str()) {
        return Ok(Some(next_session));
    }

    unsubscribe_active_session();

    let event_tx = EVENT_TX
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().cloned())
        .ok_or_else(|| std::io::Error::other("media event channel unavailable"))?;

    let playback_tx = event_tx.clone();
    let playback_token = next_session.PlaybackInfoChanged(&TypedEventHandler::<
        GlobalSystemMediaTransportControlsSession,
        PlaybackInfoChangedEventArgs,
    >::new(move |_, _| {
        let _ = playback_tx.send(MediaEvent::PlaybackChanged);
        Ok(())
    }))?;

    let media_tx = event_tx.clone();
    let media_token = next_session.MediaPropertiesChanged(&TypedEventHandler::<
        GlobalSystemMediaTransportControlsSession,
        MediaPropertiesChangedEventArgs,
    >::new(move |_, _| {
        let _ = media_tx.send(MediaEvent::MediaPropertiesChanged);
        Ok(())
    }))?;

    let timeline_tx = event_tx;
    let timeline_token = next_session.TimelinePropertiesChanged(&TypedEventHandler::<
        GlobalSystemMediaTransportControlsSession,
        TimelinePropertiesChangedEventArgs,
    >::new(move |_, _| {
        let _ = timeline_tx.send(MediaEvent::TimelineChanged);
        Ok(())
    }))?;

    if let Ok(mut guard) = ACTIVE_SESSION.lock() {
        *guard = Some(ActiveSessionRegistration {
            id: next_id,
            session: next_session.clone(),
            playback_token,
            media_token,
            timeline_token,
        });
    }

    Ok(Some(next_session))
}

#[cfg(target_os = "windows")]
fn unsubscribe_active_session() {
    let registration = ACTIVE_SESSION.lock().ok().and_then(|mut guard| guard.take());

    if let Some(registration) = registration {
        let _ = registration
            .session
            .RemovePlaybackInfoChanged(registration.playback_token);
        let _ = registration
            .session
            .RemoveMediaPropertiesChanged(registration.media_token);
        let _ = registration
            .session
            .RemoveTimelinePropertiesChanged(registration.timeline_token);
    }
}

#[cfg(target_os = "windows")]
fn get_or_refresh_active_session() -> Option<GlobalSystemMediaTransportControlsSession> {
    if let Ok(guard) = ACTIVE_SESSION.lock() {
        if let Some(registration) = guard.as_ref() {
            return Some(registration.session.clone());
        }
    }

    refresh_active_session_subscription().ok().flatten()
}

// ── State extraction ──

#[cfg(target_os = "windows")]
fn current_session_state(include_media_properties: bool) -> Option<MediaState> {
    let session = get_or_refresh_active_session()?;
    let mut state = MediaState::default();

    apply_app_name(&mut state, &session);

    if let Ok(timeline) = session.GetTimelineProperties() {
        apply_timeline(&mut state, &timeline);
    }
    if let Ok(info) = session.GetPlaybackInfo() {
        apply_playback_info(&mut state, &info);
    }
    if include_media_properties {
        if let Ok(props) = session.TryGetMediaPropertiesAsync().and_then(|op| op.get()) {
            apply_media_properties(&mut state, &props);
        }
    }

    Some(state)
}

#[cfg(target_os = "windows")]
fn apply_app_name(state: &mut MediaState, session: &GlobalSystemMediaTransportControlsSession) {
    state.app_name = session
        .SourceAppUserModelId()
        .map(|name| simplify_app_name(&name.to_string()))
        .unwrap_or_default();
}

#[cfg(target_os = "windows")]
fn apply_timeline(
    state: &mut MediaState,
    timeline: &GlobalSystemMediaTransportControlsSessionTimelineProperties,
) {
    state.position_secs = timeline
        .Position()
        .map(|pos| (pos.Duration as f64) / 10_000_000.0)
        .unwrap_or(0.0);
    state.duration_secs = timeline
        .EndTime()
        .map(|end| (end.Duration as f64) / 10_000_000.0)
        .unwrap_or(0.0);
}

#[cfg(target_os = "windows")]
fn apply_playback_info(
    state: &mut MediaState,
    info: &GlobalSystemMediaTransportControlsSessionPlaybackInfo,
) {
    if let Ok(controls) = info.Controls() {
        state.can_play = controls.IsPlayEnabled().unwrap_or(false);
        state.can_pause = controls.IsPauseEnabled().unwrap_or(false);
        state.can_next = controls.IsNextEnabled().unwrap_or(false);
        state.can_prev = controls.IsPreviousEnabled().unwrap_or(false);
    }

    state.status = info
        .PlaybackStatus()
        .map(playback_status_label)
        .unwrap_or("closed")
        .to_string();
}

#[cfg(target_os = "windows")]
fn apply_media_properties(
    state: &mut MediaState,
    props: &GlobalSystemMediaTransportControlsSessionMediaProperties,
) {
    state.title = props.Title().map(|t| t.to_string()).unwrap_or_default();
    state.artist = props.Artist().map(|a| a.to_string()).unwrap_or_default();
    state.album = props.AlbumTitle().map(|a| a.to_string()).unwrap_or_default();
    state.thumbnail_base64 = props
        .Thumbnail()
        .ok()
        .and_then(|thumb| extract_thumbnail_base64(&thumb).ok())
        .unwrap_or_default();
}

#[cfg(target_os = "windows")]
fn playback_status_label(
    status: GlobalSystemMediaTransportControlsSessionPlaybackStatus,
) -> &'static str {
    match status {
        GlobalSystemMediaTransportControlsSessionPlaybackStatus(4) => "playing",
        GlobalSystemMediaTransportControlsSessionPlaybackStatus(5) => "paused",
        GlobalSystemMediaTransportControlsSessionPlaybackStatus(3) => "stopped",
        _ => "closed",
    }
}

#[cfg(target_os = "windows")]
fn session_id(session: &GlobalSystemMediaTransportControlsSession) -> String {
    session
        .SourceAppUserModelId()
        .map(|name| name.to_string())
        .unwrap_or_default()
}

#[cfg(target_os = "windows")]
fn should_refresh_timeline() -> bool {
    LAST_STATE
        .lock()
        .map(|guard| guard.status == "playing")
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn store_and_emit(handle: &tauri::AppHandle, state: MediaState) {
    let should_emit = if let Ok(mut guard) = LAST_STATE.lock() {
        if *guard == state {
            false
        } else {
            *guard = state.clone();
            true
        }
    } else {
        true
    };

    if should_emit {
        let _ = handle.emit("media:state", &state);
    }
}

// ── Command execution ──

#[cfg(target_os = "windows")]
fn handle_media_command(cmd: &MediaCommand) {
    let Some(session) = get_or_refresh_active_session() else {
        return;
    };

    let _ = match cmd {
        MediaCommand::Play => session.TryPlayAsync().and_then(|op| op.get()).ok(),
        MediaCommand::Pause => session.TryPauseAsync().and_then(|op| op.get()).ok(),
        MediaCommand::TogglePlayPause => session.TryTogglePlayPauseAsync().and_then(|op| op.get()).ok(),
        MediaCommand::Next => session.TrySkipNextAsync().and_then(|op| op.get()).ok(),
        MediaCommand::Previous => session.TrySkipPreviousAsync().and_then(|op| op.get()).ok(),
    };
}

// ── Thumbnail ──

#[cfg(target_os = "windows")]
fn extract_thumbnail_base64(
    thumbnail: &windows::Storage::Streams::IRandomAccessStreamReference,
) -> Result<String, Box<dyn std::error::Error>> {
    use windows::Storage::Streams::{Buffer, InputStreamOptions};
    use windows::Win32::System::WinRT::IBufferByteAccess;
    use windows::core::Interface;

    let stream = thumbnail.OpenReadAsync()?.get()?;
    let size = stream.Size()?;
    if size == 0 || size > 512 * 1024 {
        return Ok(String::new());
    }

    let buffer = Buffer::Create(size as u32)?;
    stream.ReadAsync(&buffer, size as u32, InputStreamOptions::None)?.get()?;

    let byte_access: IBufferByteAccess = buffer.cast()?;
    let ptr = unsafe { byte_access.Buffer()? };
    let len = buffer.Length()? as usize;
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };

    Ok(base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        bytes,
    ))
}

#[cfg(not(target_os = "windows"))]
fn extract_thumbnail_base64(_: &()) -> Result<String, Box<dyn std::error::Error>> {
    Ok(String::new())
}

#[cfg(target_os = "windows")]
fn simplify_app_name(raw: &str) -> String {
    raw.split('.').last().unwrap_or(raw).to_string()
}
