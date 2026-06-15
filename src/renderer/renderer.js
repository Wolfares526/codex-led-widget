const ui = {
  body: document.body,
  trafficLight: document.querySelector("#trafficLight"),
  brandName: document.querySelector("#brandName"),
  stateText: document.querySelector("#stateText"),
  remaining: document.querySelector("#remaining"),
  remainingLabel: document.querySelector("#remainingLabel"),
  liquidFill: document.querySelector("#liquidFill"),
  primaryLabel: document.querySelector("#primaryLabel"),
  primaryText: document.querySelector("#primaryText"),
  secondaryLabel: document.querySelector("#secondaryLabel"),
  secondaryText: document.querySelector("#secondaryText"),
  planLabel: document.querySelector("#planLabel"),
  planText: document.querySelector("#planText"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  langBtn: document.querySelector("#langBtn"),
  pinBtn: document.querySelector("#pinBtn"),
  refreshBtn: document.querySelector("#refreshBtn"),
  minimizeBtn: document.querySelector("#minimizeBtn"),
  closeBtn: document.querySelector("#closeBtn")
};

const messages = {
  zh: {
    brand: "Codex 额度",
    loading: "读取中",
    green: "绿灯",
    yellow: "黄灯",
    red: "红灯",
    error: "连接异常",
    left: "剩余",
    primary: "5小时窗口",
    secondary: "7天窗口",
    plan: "计划",
    refreshing: "正在读取 Codex 额度...",
    updated: "已自动刷新，每 60 秒更新",
    failed: "读取失败，点击刷新重试",
    noData: "暂无数据",
    after: "后",
    pinned: "取消置顶",
    unpinned: "置顶",
    refresh: "刷新",
    hide: "隐藏",
    close: "退出"
  },
  en: {
    brand: "Codex Quota",
    loading: "Loading",
    green: "Green",
    yellow: "Yellow",
    red: "Red",
    error: "Offline",
    left: "Left",
    primary: "5h window",
    secondary: "7d window",
    plan: "Plan",
    refreshing: "Reading Codex quota...",
    updated: "Auto refreshes every 60 seconds",
    failed: "Unable to read quota. Click refresh.",
    noData: "No data",
    after: "left",
    pinned: "Unpin",
    unpinned: "Pin",
    refresh: "Refresh",
    hide: "Hide",
    close: "Quit"
  }
};

let language = localStorage.getItem("language") || "zh";
let latestQuota = null;
let isPinned = true;
let isLoading = false;

function text() {
  return messages[language];
}

function stateFor(percent) {
  if (percent <= 0) return "red";
  if (percent < 10) return "yellow";
  return "green";
}

function formatDuration(resetsAt) {
  if (!resetsAt) return text().noData;
  const remainingMs = Math.max(0, new Date(resetsAt).getTime() - Date.now());
  const totalMinutes = Math.ceil(remainingMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (language === "en") {
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分`;
  return `${minutes}分钟`;
}

function formatWindow(window) {
  if (!window) return text().noData;
  const reset = formatDuration(window.resetsAt);
  return language === "en"
    ? `${window.remainingPercent}% · ${reset} ${text().after}`
    : `${window.remainingPercent}% · ${reset}${text().after}`;
}

function applyStaticText() {
  const copy = text();
  ui.brandName.textContent = copy.brand;
  ui.remainingLabel.textContent = copy.left;
  ui.primaryLabel.textContent = copy.primary;
  ui.secondaryLabel.textContent = copy.secondary;
  ui.planLabel.textContent = copy.plan;
  ui.langBtn.textContent = language === "zh" ? "EN" : "中";
  ui.refreshBtn.title = copy.refresh;
  ui.refreshBtn.setAttribute("aria-label", copy.refresh);
  ui.minimizeBtn.title = copy.hide;
  ui.minimizeBtn.setAttribute("aria-label", copy.hide);
  ui.closeBtn.title = copy.close;
  ui.closeBtn.setAttribute("aria-label", copy.close);
  updatePinButton();
}

function updatePinButton() {
  const label = isPinned ? text().pinned : text().unpinned;
  ui.pinBtn.classList.toggle("active", isPinned);
  ui.pinBtn.title = label;
  ui.pinBtn.setAttribute("aria-label", label);
}

function setVisualState(state) {
  ui.body.dataset.state = state;
  ui.trafficLight.className = `traffic-light ${state}`;
  ui.statusDot.className = `status-dot ${state}`;
  ui.stateText.textContent = text()[state];
}

function renderQuota(quota) {
  latestQuota = quota;
  const percent = Number.isFinite(quota.remainingPercent) ? quota.remainingPercent : 0;
  const state = stateFor(percent);

  applyStaticText();
  setVisualState(state);
  ui.remaining.textContent = `${percent}%`;
  ui.liquidFill.style.setProperty("--level", `${Math.max(5, percent)}%`);
  ui.primaryText.textContent = formatWindow(quota.primary);
  ui.secondaryText.textContent = formatWindow(quota.secondary);
  ui.planText.textContent = String(quota.planType || "unknown").toUpperCase();
  ui.statusText.textContent = text().updated;
}

function renderLoading() {
  applyStaticText();
  setVisualState("loading");
  ui.statusText.textContent = text().refreshing;
}

function renderError(error) {
  applyStaticText();
  setVisualState("error");
  ui.remaining.textContent = "--%";
  ui.liquidFill.style.setProperty("--level", "5%");
  ui.primaryText.textContent = text().noData;
  ui.secondaryText.textContent = text().noData;
  ui.planText.textContent = "--";
  ui.statusText.textContent = text().failed;
  console.error("Failed to read Codex quota:", error);
}

async function refreshQuota() {
  if (isLoading) return;
  isLoading = true;
  renderLoading();

  try {
    if (!window.codexQuota) {
      throw new Error("Codex quota bridge is unavailable.");
    }
    const quota = await window.codexQuota.getQuota();
    renderQuota(quota);
  } catch (error) {
    renderError(error);
  } finally {
    isLoading = false;
  }
}

ui.langBtn.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  localStorage.setItem("language", language);
  if (latestQuota) renderQuota(latestQuota);
  else renderLoading();
});

ui.pinBtn.addEventListener("click", async () => {
  isPinned = await window.codexQuota.setAlwaysOnTop(!isPinned);
  updatePinButton();
});

ui.refreshBtn.addEventListener("click", refreshQuota);
ui.minimizeBtn.addEventListener("click", () => window.codexQuota.minimize());
ui.closeBtn.addEventListener("click", () => window.codexQuota.close());

window.codexQuota?.onRefresh(refreshQuota);
window.codexQuota?.onAlwaysOnTopChanged((value) => {
  isPinned = Boolean(value);
  updatePinButton();
});

async function initialize() {
  applyStaticText();
  if (window.codexQuota) {
    isPinned = await window.codexQuota.getAlwaysOnTop();
    updatePinButton();
  }
  await refreshQuota();
}

initialize();
setInterval(refreshQuota, 60000);
setInterval(() => {
  if (latestQuota && !isLoading) renderQuota(latestQuota);
}, 30000);
