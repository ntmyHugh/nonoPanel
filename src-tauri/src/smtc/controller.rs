use crate::commands::smtc::SmtcUpdatePayload;

/// SMTC Controller — wraps Windows SystemMediaTransportControls.
///
/// On Windows, this manages the media overlay card shown when the user
/// presses volume keys or interacts with media playback controls.
/// It maps pomodoro timer state to SMTC playback status.
///
/// Uses the Win32 desktop interop pattern (ISystemMediaTransportControlsInterop)
/// rather than the UWP-only `GetForCurrentView()`, since Tauri produces
/// Win32 desktop applications with WebView2.
#[cfg(target_os = "windows")]
use windows::{
    core::{HSTRING, Interface},
    Foundation::TimeSpan,
    Media::{
        MediaPlaybackStatus, MediaPlaybackType,
        SystemMediaTransportControls,
        SystemMediaTransportControlsTimelineProperties,
    },
    Win32::{
        Foundation::HWND,
        System::WinRT::ISystemMediaTransportControlsInterop,
    },
};

#[cfg(target_os = "windows")]
use std::sync::{Mutex, LazyLock};
#[cfg(target_os = "windows")]
use std::time::Duration;

#[cfg(target_os = "windows")]
static SMTC_INSTANCE: LazyLock<Mutex<Option<SystemMediaTransportControls>>> =
    LazyLock::new(|| Mutex::new(None));

pub struct SmtcController;

impl SmtcController {
    /// Initialize the SMTC instance on app startup.
    /// Uses Win32 desktop interop to get SMTC for the Tauri window's HWND.
    pub fn init(app_handle: tauri::AppHandle) {
        #[cfg(target_os = "windows")]
        {
            use tauri::Manager;

            let hwnd_result = app_handle
                .get_webview_window("main")
                .and_then(|w| w.hwnd().ok());

            match hwnd_result {
                Some(hwnd_val) => {
                    // Tauri returns windows 0.61 HWND; extract raw ptr for our 0.58 HWND
                    let hwnd = HWND(hwnd_val.0);
                    let controls = Self::create_smtc_for_window(hwnd);
                    match controls {
                        Ok(ctrl) => {
                            let _ = ctrl.SetIsEnabled(false);
                            if let Ok(mut guard) = SMTC_INSTANCE.lock() {
                                *guard = Some(ctrl);
                            }
                            log::info!("SMTC initialized successfully via Win32 interop");
                        }
                        Err(e) => {
                            log::warn!("Failed to create SMTC for window: {:?}", e);
                        }
                    }
                }
                None => {
                    log::warn!("Could not get window HWND for SMTC");
                }
            }
        }
        #[cfg(not(target_os = "windows"))]
        let _ = app_handle;
    }

    /// Create SMTC for a specific Win32 window via COM interop.
    #[cfg(target_os = "windows")]
    fn create_smtc_for_window(
        hwnd: HWND,
    ) -> windows::core::Result<SystemMediaTransportControls> {
        let interop: ISystemMediaTransportControlsInterop = unsafe {
            let factory: windows::Win32::System::WinRT::IActivationFactory =
                windows::Win32::System::WinRT::RoGetActivationFactory(
                    &HSTRING::from("Windows.Media.SystemMediaTransportControls"),
                )?;
            factory.cast()?
        };

        let controls = unsafe { interop.GetForWindow(hwnd)? };
        Ok(controls)
    }

    /// Get or create the SMTC instance.
    #[cfg(target_os = "windows")]
    pub fn get_or_create(
        app_handle: &tauri::AppHandle,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let guard = SMTC_INSTANCE.lock().map_err(|e| e.to_string())?;
        if guard.is_none() {
            drop(guard);
            Self::init(app_handle.clone());
        }
        Ok(SmtcController)
    }

    #[cfg(not(target_os = "windows"))]
    pub fn get_or_create(
        _app_handle: &tauri::AppHandle,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(SmtcController)
    }

    /// Update the SMTC display with current pomodoro state.
    #[cfg(target_os = "windows")]
    pub fn update(
        &self,
        payload: SmtcUpdatePayload,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let guard = SMTC_INSTANCE.lock().map_err(|e| e.to_string())?;
        let ctrl = guard.as_ref().ok_or("SMTC not initialized")?;

        let playback_status = match payload.status.as_str() {
            "playing" => MediaPlaybackStatus(4), // Playing
            "paused" => MediaPlaybackStatus(5),  // Paused
            _ => MediaPlaybackStatus(6),          // Stopped
        };

        ctrl.SetIsEnabled(true)?;
        ctrl.SetPlaybackStatus(playback_status)?;

        let updater = ctrl.DisplayUpdater()?;
        updater.SetType(MediaPlaybackType(3))?; // Music

        let music_props = updater.MusicProperties()?;
        music_props.SetTitle(&HSTRING::from(payload.title.as_str()))?;
        music_props.SetArtist(&HSTRING::from(payload.subtitle.as_str()))?;
        updater.Update()?;

        // Set timeline (progress bar)
        if payload.total_time_secs > 0.0 {
            let timeline = SystemMediaTransportControlsTimelineProperties::new()?;
            let elapsed = payload.total_time_secs - payload.time_left_secs;
            let elapsed_dur = Duration::from_secs_f64(elapsed.max(0.0));
            let total_dur = Duration::from_secs_f64(payload.total_time_secs);

            timeline.SetPosition(TimeSpan::from(elapsed_dur))?;
            timeline.SetEndTime(TimeSpan::from(total_dur))?;
            ctrl.UpdateTimelineProperties(&timeline)?;
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    pub fn update(
        &self,
        _payload: SmtcUpdatePayload,
    ) -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }

    /// Clear the SMTC display (e.g., when pomodoro is reset).
    #[cfg(target_os = "windows")]
    pub fn clear() -> Result<(), Box<dyn std::error::Error>> {
        let guard = SMTC_INSTANCE.lock().map_err(|e| e.to_string())?;
        if let Some(ctrl) = guard.as_ref() {
            ctrl.SetIsEnabled(false)?;
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    pub fn clear() -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }
}
