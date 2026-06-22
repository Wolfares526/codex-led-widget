use tauri::{
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  App, AppHandle, Emitter, Manager, PhysicalPosition, Runtime, WebviewWindow,
};

const MAIN_WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "main-tray";
const MENU_TOGGLE: &str = "toggle";
const MENU_REFRESH: &str = "refresh";
const MENU_PIN: &str = "pin";
const MENU_QUIT: &str = "quit";
const WINDOW_MARGIN: i32 = 24;

pub fn setup_desktop<R: Runtime>(app: &mut App<R>) -> tauri::Result<()> {
  let handle = app.handle().clone();

  if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
    place_window_top_right(&window)?;
  }

  create_tray(app, handle)?;
  Ok(())
}

fn create_tray<R: Runtime>(app: &App<R>, handle: AppHandle<R>) -> tauri::Result<()> {
  let toggle = MenuItem::with_id(app, MENU_TOGGLE, "显示/隐藏", true, None::<&str>)?;
  let refresh = MenuItem::with_id(app, MENU_REFRESH, "刷新额度", true, None::<&str>)?;
  let pin = MenuItem::with_id(app, MENU_PIN, "取消置顶/置顶", true, None::<&str>)?;
  let separator = PredefinedMenuItem::separator(app)?;
  let quit = MenuItem::with_id(app, MENU_QUIT, "退出", true, None::<&str>)?;
  let menu = Menu::with_items(app, &[&toggle, &refresh, &pin, &separator, &quit])?;
  let icon = app.default_window_icon().cloned();

  let mut builder = TrayIconBuilder::with_id(TRAY_ID)
    .tooltip("Codex Quota Widget")
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(move |app, event| match event.id().as_ref() {
      MENU_TOGGLE => toggle_window(app),
      MENU_REFRESH => emit_quota_refresh(app),
      MENU_PIN => toggle_pin(app),
      MENU_QUIT => app.exit(0),
      _ => {}
    })
    .on_tray_icon_event(move |_tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        toggle_window(&handle);
      }
    });

  if let Some(icon) = icon {
    builder = builder.icon(icon);
  }

  builder.build(app)?;
  Ok(())
}

fn toggle_window<R: Runtime>(app: &AppHandle<R>) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
    return;
  };

  let is_visible = window.is_visible().unwrap_or(false);
  if is_visible {
    let _ = window.hide();
  } else {
    let _ = place_window_top_right(&window);
    let _ = window.show();
    let _ = window.set_focus();
  }
}

fn emit_quota_refresh<R: Runtime>(app: &AppHandle<R>) {
  if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
    let _ = window.emit("quota://refresh", ());
  }
}

fn toggle_pin<R: Runtime>(app: &AppHandle<R>) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
    return;
  };

  let is_pinned = window.is_always_on_top().unwrap_or(true);
  let next = !is_pinned;
  if window.set_always_on_top(next).is_ok() {
    let _ = window.emit("window://always-on-top-changed", next);
  }
}

fn place_window_top_right<R: Runtime>(window: &WebviewWindow<R>) -> tauri::Result<()> {
  let Some(monitor) = window.primary_monitor()? else {
    return Ok(());
  };

  let work_area = monitor.work_area();
  let size = window.outer_size()?;
  let x = work_area.position.x + work_area.size.width as i32 - size.width as i32 - WINDOW_MARGIN;
  let y = work_area.position.y + WINDOW_MARGIN;

  window.set_position(PhysicalPosition::new(x, y))
}
