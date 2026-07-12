mod tray;
mod commands;

use tauri::Manager;

#[cfg(target_os = "macos")]
const PANEL_RADIUS: f64 = 15.0;

#[cfg(target_os = "macos")]
fn configure_macos_panel_window(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    use objc2_app_kit::{
        NSColor, NSPopUpMenuWindowLevel, NSWindow, NSWindowCollectionBehavior,
    };
    use objc2_foundation::{ns_string, NSNumber, NSObjectNSKeyValueCoding};
    use objc2_web_kit::WKWebView;

    unsafe {
        let ns_window: &NSWindow = &*window.ns_window()?.cast();
        let clear = NSColor::clearColor();

        ns_window.setOpaque(false);
        ns_window.setBackgroundColor(Some(&clear));
        ns_window.setHasShadow(true);
        ns_window.setLevel(NSPopUpMenuWindowLevel);
        ns_window.setCollectionBehavior(
            ns_window.collectionBehavior()
                | NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::Auxiliary
                | NSWindowCollectionBehavior::FullScreenAuxiliary,
        );

        if let Some(content_view) = ns_window.contentView() {
            content_view.setWantsLayer(true);
            if let Some(layer) = content_view.layer() {
                layer.setCornerRadius(PANEL_RADIUS);
                layer.setMasksToBounds(true);
            }
        }
    }

    window.with_webview(|webview| unsafe {
        let webview: &WKWebView = &*webview.inner().cast();
        let clear = NSColor::clearColor();
        let no = NSNumber::numberWithBool(false);

        webview.setValue_forKey(Some(&*no), ns_string!("drawsBackground"));
        webview.setUnderPageBackgroundColor(Some(&clear));
    })?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::update_tray_title,
            commands::animate_panel_size,
            commands::set_ignore_blur
        ])
        .setup(|app| {
            // Hide from Dock on macOS
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Create system tray
            tray::create_tray(app.handle())?;

            if let Some(window) = app.get_webview_window("panel") {
                #[cfg(target_os = "macos")]
                {
                    configure_macos_panel_window(&window)?;

                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Popover, None, Some(PANEL_RADIUS));
                }

                // Hide panel when it loses focus (click outside),
                // unless a native dialog is open (IGNORE_BLUR flag)
                let w = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        #[cfg(debug_assertions)]
                        eprintln!(
                            "[BurnRate tray] panel lost focus; ignore_blur={}",
                            commands::IGNORE_BLUR.load(std::sync::atomic::Ordering::Relaxed)
                        );
                        if !commands::IGNORE_BLUR.load(std::sync::atomic::Ordering::Relaxed) {
                            let _ = w.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
