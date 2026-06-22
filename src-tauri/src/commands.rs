use crate::quota::{self, QuotaSnapshot};
use tauri::Emitter;

#[tauri::command]
pub async fn get_quota() -> Result<QuotaSnapshot, String> {
  tauri::async_runtime::spawn_blocking(quota::get_quota)
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn hide_window(window: tauri::Window) -> Result<(), String> {
  window.hide().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn close_app(app: tauri::AppHandle) {
  app.exit(0);
}

#[tauri::command]
pub fn set_always_on_top(window: tauri::Window, value: bool) -> Result<bool, String> {
  window
    .set_always_on_top(value)
    .map_err(|error| error.to_string())?;
  window
    .emit("window://always-on-top-changed", value)
    .map_err(|error| error.to_string())?;
  Ok(value)
}
