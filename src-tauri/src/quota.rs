use serde::Serialize;
use serde_json::{json, Value};
use std::{
  env,
  error::Error,
  ffi::OsStr,
  fs::{self, DirEntry},
  io::{BufRead, BufReader, Error as IoError, Read, Write},
  path::{Path, PathBuf},
  process::{Child, Command, Stdio},
  sync::mpsc::{self, Receiver},
  thread,
  time::{Duration, SystemTime, UNIX_EPOCH},
};

const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

type QuotaResult<T> = Result<T, Box<dyn Error + Send + Sync>>;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaWindow {
  used_percent: u8,
  remaining_percent: u8,
  window_duration_mins: Option<u64>,
  resets_at: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaSnapshot {
  limit_id: String,
  limit_name: String,
  plan_type: String,
  reached_type: Option<String>,
  credits: Option<Value>,
  primary: Option<QuotaWindow>,
  secondary: Option<QuotaWindow>,
  remaining_percent: Option<u8>,
  used_percent: Option<u8>,
  resets_at: Option<String>,
  fetched_at: String,
}

pub fn get_quota() -> QuotaResult<QuotaSnapshot> {
  match request_rate_limits().and_then(|response| {
    let snapshot = select_snapshot(&response)
      .ok_or_else(|| "Codex did not return a rate-limit snapshot.".to_string())?;
    Ok(normalize_snapshot(snapshot))
  }) {
    Ok(quota) => {
      write_diagnostic("Quota read succeeded.");
      Ok(quota)
    }
    Err(error) => {
      write_diagnostic(&format!("Quota read failed: {error}"));
      Err(error)
    }
  }
}

fn request_rate_limits() -> QuotaResult<Value> {
  let codex_path = resolve_codex_path()?;
  let mut child = Command::new(&codex_path)
    .args(["app-server", "--listen", "stdio://"])
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .creation_flags_no_window()
    .spawn()?;

  let mut stdin = child
    .stdin
    .take()
    .ok_or_else(|| "Codex stdin was unavailable.".to_string())?;
  let stdout = child
    .stdout
    .take()
    .ok_or_else(|| "Codex stdout was unavailable.".to_string())?;
  let stderr = child
    .stderr
    .take()
    .ok_or_else(|| "Codex stderr was unavailable.".to_string())?;

  let (line_tx, line_rx) = mpsc::channel();
  thread::spawn(move || {
    let reader = BufReader::new(stdout);
    for line in reader.lines().map_while(Result::ok) {
      if line_tx.send(line).is_err() {
        break;
      }
    }
  });

  let (stderr_tx, stderr_rx) = mpsc::channel();
  thread::spawn(move || {
    let mut reader = BufReader::new(stderr);
    let mut buffer = String::new();
    let _ = reader.read_to_string(&mut buffer);
    let _ = stderr_tx.send(buffer);
  });

  let result = (|| {
    send_request(
      &mut stdin,
      &line_rx,
      1,
      "initialize",
      Some(json!({
        "clientInfo": {
          "name": "codex-led-widget",
          "title": "Codex LED Widget",
          "version": "0.1.0"
        },
        "capabilities": null
      })),
    )?;

    send_request(&mut stdin, &line_rx, 2, "account/rateLimits/read", None)
  })();

  cleanup_child(&mut child);

  match result {
    Ok(value) => Ok(value),
    Err(error) => {
      let stderr = stderr_rx.recv_timeout(Duration::from_millis(200)).unwrap_or_default();
      if stderr.trim().is_empty() {
        Err(error)
      } else {
        Err(quota_error(stderr))
      }
    }
  }
}

fn send_request(
  stdin: &mut impl Write,
  lines: &Receiver<String>,
  id: u64,
  method: &str,
  params: Option<Value>,
) -> QuotaResult<Value> {
  let payload = match params {
    Some(params) => json!({ "id": id, "method": method, "params": params }),
    None => json!({ "id": id, "method": method }),
  };
  writeln!(stdin, "{payload}")?;
  stdin.flush()?;

  loop {
    let line = lines
      .recv_timeout(DEFAULT_TIMEOUT)
      .map_err(|_| quota_error(format!("Codex request timed out: {method}")))?;

    let message: Value = match serde_json::from_str(line.trim()) {
      Ok(message) => message,
      Err(_) => continue,
    };

    if message.get("id").and_then(Value::as_u64) != Some(id) {
      continue;
    }

    if let Some(error) = message.get("error") {
      let message = error
        .get("message")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .unwrap_or_else(|| error.to_string());
      return Err(quota_error(message));
    }

    return Ok(message.get("result").cloned().unwrap_or(Value::Null));
  }
}

fn resolve_codex_path() -> QuotaResult<PathBuf> {
  let cache_root = get_cache_root();
  let mut candidates = Vec::new();

  if let Some(path) = env::var_os("CODEX_CLI_PATH") {
    candidates.push(PathBuf::from(path));
  }

  if let Some(local_app_data) = env::var_os("LOCALAPPDATA") {
    candidates.push(
      PathBuf::from(local_app_data)
        .join("OpenAI")
        .join("Codex")
        .join("bin")
        .join("codex.exe"),
    );
  }

  candidates.extend(find_cached_executables(&cache_root));
  candidates.extend(find_executables_on_path("codex.exe"));

  for candidate in candidates {
    if !candidate.exists() {
      continue;
    }

    let resolved = if is_windows_apps_path(&candidate) {
      cache_codex_executable(&candidate)?
    } else {
      candidate
    };
    write_diagnostic(&format!("Using Codex CLI: {}", resolved.display()));
    return Ok(resolved);
  }

  let message = "Codex CLI was not found. Set CODEX_CLI_PATH to an accessible codex.exe path.";
  write_diagnostic(message);
  Err(quota_error(message))
}

fn find_executables_on_path(file_name: &str) -> Vec<PathBuf> {
  env::var_os("PATH")
    .map(|value| {
      env::split_paths(&value)
        .map(|entry| entry.join(file_name))
        .collect()
    })
    .unwrap_or_default()
}

fn find_cached_executables(cache_root: &Path) -> Vec<PathBuf> {
  let mut entries: Vec<DirEntry> = match fs::read_dir(cache_root) {
    Ok(entries) => entries.flatten().collect(),
    Err(_) => return Vec::new(),
  };

  entries.sort_by_key(|entry| {
    entry
      .metadata()
      .and_then(|metadata| metadata.modified())
      .ok()
      .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
      .map(|duration| std::cmp::Reverse(duration.as_millis()))
  });

  entries
    .into_iter()
    .filter_map(|entry| {
      let path = entry.path();
      let name = path.file_name().and_then(OsStr::to_str)?;
      let is_codex_cache = name.starts_with("codex-") && name.to_ascii_lowercase().ends_with(".exe");
      path.is_file().then_some(()).filter(|_| is_codex_cache)?;
      Some(path)
    })
    .collect()
}

fn is_windows_apps_path(path: &Path) -> bool {
  let normalized = path.to_string_lossy().to_ascii_lowercase();
  normalized.contains("\\windowsapps\\") || normalized.contains("/windowsapps/")
}

fn get_cache_root() -> PathBuf {
  env::var_os("LOCALAPPDATA")
    .map(PathBuf::from)
    .unwrap_or_else(env::temp_dir)
    .join("codex-led-widget")
    .join("bin")
}

fn cache_codex_executable(source_path: &Path) -> QuotaResult<PathBuf> {
  let metadata = fs::metadata(source_path)?;
  let modified = metadata
    .modified()?
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis();
  let target = get_cache_root().join(format!("codex-{}-{}.exe", metadata.len(), modified));

  if !target.exists() {
    if let Some(parent) = target.parent() {
      fs::create_dir_all(parent)?;
    }
    fs::copy(source_path, &target)?;
  }

  Ok(target)
}

fn select_snapshot(response: &Value) -> Option<&Value> {
  response
    .pointer("/rateLimitsByLimitId/codex")
    .or_else(|| response.get("rateLimits"))
    .or_else(|| {
      response
        .get("rateLimitsByLimitId")
        .and_then(Value::as_object)
        .and_then(|map| map.values().next())
    })
}

fn normalize_snapshot(snapshot: &Value) -> QuotaSnapshot {
  let primary = normalize_window(snapshot.get("primary"));
  let secondary = normalize_window(snapshot.get("secondary"));
  let active = primary.as_ref().or(secondary.as_ref());
  let remaining_percent = active.map(|window| window.remaining_percent);
  let used_percent = active.map(|window| window.used_percent);
  let resets_at = active.and_then(|window| window.resets_at.clone());

  QuotaSnapshot {
    limit_id: string_or(snapshot, "limitId", "codex"),
    limit_name: string_or(snapshot, "limitName", "Codex"),
    plan_type: string_or(snapshot, "planType", "unknown"),
    reached_type: snapshot
      .get("rateLimitReachedType")
      .and_then(Value::as_str)
      .map(str::to_owned),
    credits: snapshot.get("credits").cloned(),
    primary,
    secondary,
    remaining_percent,
    used_percent,
    resets_at,
    fetched_at: now_iso_string(),
  }
}

fn normalize_window(window: Option<&Value>) -> Option<QuotaWindow> {
  let window = window?;
  let used_percent = clamp_percent(window.get("usedPercent").and_then(Value::as_f64).unwrap_or(0.0));
  Some(QuotaWindow {
    used_percent,
    remaining_percent: 100_u8.saturating_sub(used_percent),
    window_duration_mins: window.get("windowDurationMins").and_then(Value::as_u64),
    resets_at: window
      .get("resetsAt")
      .and_then(Value::as_i64)
      .map(|seconds| unix_seconds_to_iso_string(seconds.max(0) as u64)),
  })
}

fn string_or(value: &Value, key: &str, fallback: &str) -> String {
  value
    .get(key)
    .and_then(Value::as_str)
    .unwrap_or(fallback)
    .to_owned()
}

fn clamp_percent(value: f64) -> u8 {
  if !value.is_finite() {
    return 0;
  }
  value.round().clamp(0.0, 100.0) as u8
}

fn write_diagnostic(message: &str) {
  let result = (|| -> std::io::Result<()> {
    let log_root = env::var_os("LOCALAPPDATA")
      .map(PathBuf::from)
      .unwrap_or_else(env::temp_dir)
      .join("codex-led-widget");
    fs::create_dir_all(&log_root)?;
    let mut file = fs::OpenOptions::new()
      .create(true)
      .append(true)
      .open(log_root.join("quota-service.log"))?;
    writeln!(file, "[{}] {}", now_iso_string(), message)?;
    Ok(())
  })();

  let _ = result;
}

fn cleanup_child(child: &mut Child) {
  if child.try_wait().ok().flatten().is_none() {
    let _ = child.kill();
    let _ = child.wait();
  }
}

fn quota_error(message: impl Into<String>) -> Box<dyn Error + Send + Sync> {
  Box::new(IoError::other(message.into()))
}

fn now_iso_string() -> String {
  let seconds = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  unix_seconds_to_iso_string(seconds)
}

fn unix_seconds_to_iso_string(seconds: u64) -> String {
  let days = (seconds / 86_400) as i64;
  let seconds_of_day = seconds % 86_400;
  let (year, month, day) = civil_from_days(days);
  let hour = seconds_of_day / 3_600;
  let minute = (seconds_of_day % 3_600) / 60;
  let second = seconds_of_day % 60;
  format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}

fn civil_from_days(days_since_unix_epoch: i64) -> (i64, u64, u64) {
  let z = days_since_unix_epoch + 719_468;
  let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
  let doe = z - era * 146_097;
  let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
  let mut year = yoe + era * 400;
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  let mp = (5 * doy + 2) / 153;
  let day = doy - (153 * mp + 2) / 5 + 1;
  let month = mp + if mp < 10 { 3 } else { -9 };
  year += if month <= 2 { 1 } else { 0 };
  (year, month as u64, day as u64)
}

trait CommandExtNoWindow {
  fn creation_flags_no_window(&mut self) -> &mut Self;
}

impl CommandExtNoWindow for Command {
  #[cfg(windows)]
  fn creation_flags_no_window(&mut self) -> &mut Self {
    use std::os::windows::process::CommandExt;
    self.creation_flags(0x0800_0000)
  }

  #[cfg(not(windows))]
  fn creation_flags_no_window(&mut self) -> &mut Self {
    self
  }
}
