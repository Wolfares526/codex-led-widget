// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  let _single_instance = single_instance::guard_or_exit();
  codex_led_widget_lib::run();
}

#[cfg(target_os = "windows")]
mod single_instance {
  use windows_sys::Win32::{
    Foundation::{CloseHandle, GetLastError, ERROR_ALREADY_EXISTS, HANDLE},
    System::Threading::CreateMutexW,
    UI::WindowsAndMessaging::{
      MessageBoxW, MB_ICONINFORMATION, MB_OK, MB_SETFOREGROUND, MB_TOPMOST,
    },
  };

  const MUTEX_NAME: &str = "Global\\CodexLedWidget.SingleInstance";
  const DIALOG_TITLE: &str = "Codex LED Widget";
  const DIALOG_MESSAGE: &str = "Codex LED Widget 已在运行。";

  pub struct SingleInstanceGuard(HANDLE);

  impl Drop for SingleInstanceGuard {
    fn drop(&mut self) {
      if !self.0.is_null() {
        unsafe {
          CloseHandle(self.0);
        }
      }
    }
  }

  pub fn guard_or_exit() -> SingleInstanceGuard {
    let mutex_name = wide_null(MUTEX_NAME);
    let handle = unsafe { CreateMutexW(std::ptr::null_mut(), 1, mutex_name.as_ptr()) };

    if handle.is_null() {
      return SingleInstanceGuard(handle);
    }

    if unsafe { GetLastError() } == ERROR_ALREADY_EXISTS {
      show_already_running_message();
      unsafe {
        CloseHandle(handle);
      }
      std::process::exit(0);
    }

    SingleInstanceGuard(handle)
  }

  fn show_already_running_message() {
    let title = wide_null(DIALOG_TITLE);
    let message = wide_null(DIALOG_MESSAGE);
    unsafe {
      MessageBoxW(
        std::ptr::null_mut(),
        message.as_ptr(),
        title.as_ptr(),
        MB_OK | MB_ICONINFORMATION | MB_TOPMOST | MB_SETFOREGROUND,
      );
    }
  }

  fn wide_null(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
  }
}

#[cfg(not(target_os = "windows"))]
mod single_instance {
  pub struct SingleInstanceGuard;

  pub fn guard_or_exit() -> SingleInstanceGuard {
    SingleInstanceGuard
  }
}
