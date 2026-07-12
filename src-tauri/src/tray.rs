use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

const PANEL_WIDTH: f64 = 288.0;
const PANEL_MAX_HEIGHT: f64 = 516.0;

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let quit = MenuItemBuilder::with_id("quit", "Quit BurnRate").build(app)?;
    let menu = MenuBuilder::new(app).item(&quit).build()?;

    let tray = TrayIconBuilder::with_id("burnrate-tray")
        .icon(Image::new_owned(vec![0, 0, 0, 0], 1, 1))
        .icon_as_template(true)
        .title("$0/mo")
        .tooltip("BurnRate")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            #[cfg(debug_assertions)]
            eprintln!("[BurnRate tray] event: {event:?}");

            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                // Fullscreen apps can take ownership of mouse-up before the
                // status item receives it, so open the panel on mouse-down.
                button_state: MouseButtonState::Down,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                toggle_panel(app, &rect);
            }
        })
        .build(app)?;

    // Remove icon so only the title text shows in the menu bar
    let _ = tray.set_icon(None);

    Ok(())
}

#[cfg(target_os = "macos")]
fn bring_panel_to_front<R: Runtime>(app: &AppHandle<R>, window: &tauri::WebviewWindow<R>) {
    use objc2_app_kit::{NSApplication, NSWindow};
    use objc2_foundation::MainThreadMarker;

    // Fullscreen apps can cause a transient focus-loss event while AppKit is
    // activating this accessory app. Keep the panel alive through that handoff.
    crate::commands::IGNORE_BLUR.store(true, std::sync::atomic::Ordering::SeqCst);

    #[cfg(debug_assertions)]
    eprintln!("[BurnRate tray] showing panel");

    let _ = app.show();
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.run_on_main_thread({
        let window = window.clone();
        move || unsafe {
            if let Some(mtm) = MainThreadMarker::new() {
                let app = NSApplication::sharedApplication(mtm);
                #[allow(deprecated)]
                app.activateIgnoringOtherApps(true);
            }

            if let Ok(ns_window) = window.ns_window() {
                let ns_window: &NSWindow = &*ns_window.cast();
                ns_window.makeKeyAndOrderFront(None);
                ns_window.orderFrontRegardless();
            }
        }
    });

    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(500));
        crate::commands::IGNORE_BLUR.store(false, std::sync::atomic::Ordering::SeqCst);
    });
}

fn toggle_panel<R: Runtime>(
    app: &AppHandle<R>,
    rect: &tauri::Rect,
) {
    if let Some(window) = app.get_webview_window("panel") {
        let visible = window.is_visible().unwrap_or(false);
        let focused = window.is_focused().unwrap_or(false);
        #[cfg(debug_assertions)]
        eprintln!("[BurnRate tray] toggle: visible={visible}, focused={focused}, rect={rect:?}");
        if visible && focused {
            let _ = window.hide();
            return;
        }

        let scale = window.scale_factor().unwrap_or(1.0);
        let panel_size = window
            .inner_size()
            .unwrap_or(tauri::PhysicalSize::new(PANEL_WIDTH as u32, PANEL_MAX_HEIGHT as u32));
        let panel_width = panel_size.width as f64;
        let panel_height = panel_size.height as f64;

        // Convert rect position and size to physical pixels
        let rect_pos = rect.position.to_physical::<f64>(scale);
        let rect_size = rect.size.to_physical::<f64>(scale);

        // Center panel horizontally below tray icon
        let x = rect_pos.x + (rect_size.width / 2.0) - (panel_width / 2.0);
        let y = rect_pos.y + rect_size.height + 4.0;

        // Clamp to monitor bounds
        let (final_x, final_y) = if let Some(monitor) = window.current_monitor().unwrap_or(None) {
            let mon_pos = monitor.position();
            let mon_size = monitor.size();

            let max_x = mon_pos.x as f64 + mon_size.width as f64 - panel_width;
            let max_y = mon_pos.y as f64 + mon_size.height as f64 - panel_height;

            (x.max(mon_pos.x as f64).min(max_x), y.min(max_y))
        } else {
            (x, y)
        };

        let position_result = window.set_position(tauri::Position::Physical(
            tauri::PhysicalPosition::new(final_x as i32, final_y as i32),
        ));
        #[cfg(debug_assertions)]
        eprintln!("[BurnRate tray] position: x={final_x}, y={final_y}, result={position_result:?}");

        #[cfg(target_os = "macos")]
        bring_panel_to_front(app, &window);

        #[cfg(not(target_os = "macos"))]
        let _ = window.show();

        let _ = window.set_focus();
        let _ = window.emit("panel-shown", ());
    }
}
