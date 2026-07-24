use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager,
};

pub fn init_tray(app_handle: &tauri::AppHandle) -> tauri::Result<()> {
    let show_item = MenuItemBuilder::with_id("show", "显示/隐藏")
        .build(app_handle)?;
    let quit_item = MenuItemBuilder::with_id("quit", "退出")
        .build(app_handle)?;

    let menu = MenuBuilder::new(app_handle)
        .item(&show_item)
        .separator()
        .item(&quit_item)
        .build()?;

    // Use a fallback icon if default is not available
    let icon = app_handle
        .default_window_icon()
        .cloned()
        .unwrap_or_else(|| {
            tauri::image::Image::new(&[0u8; 32 * 32 * 4], 32, 32)
        });

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .tooltip("nonoPanel")
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        match window.is_visible() {
                            Ok(true) => {
                                let _ = window.hide();
                            }
                            _ => {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        })
        .build(app_handle)?;

    Ok(())
}
