import { computed, ref } from "vue";

type Language = "zh" | "en";

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
} as const;

const language = ref<Language>((localStorage.getItem("language") as Language) || "zh");

export function useLocale() {
  const copy = computed(() => messages[language.value]);

  function toggleLanguage() {
    language.value = language.value === "zh" ? "en" : "zh";
    localStorage.setItem("language", language.value);
  }

  return {
    copy,
    language,
    toggleLanguage
  };
}
