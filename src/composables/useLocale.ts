import { computed, ref } from "vue";

type Language = "zh" | "en";

const messages = {
  zh: {
    brand: "Codex",
    loading: "读取中",
    green: "绿灯",
    yellow: "黄灯",
    red: "红灯",
    error: "连接异常",
    left: "剩余",
    primary: "5小时窗口",
    primaryShort: "5小时",
    secondary: "7天窗口",
    secondaryShort: "7天",
    plan: "计划",
    refreshing: "读取中",
    updated: "60秒刷新",
    failed: "读取失败，点击刷新重试",
    noData: "暂无数据",
    deadline: "截止",
    after: "后",
    pinned: "取消置顶",
    unpinned: "置顶",
    refresh: "刷新",
    hide: "隐藏",
    close: "退出"
  },
  en: {
    brand: "Codex",
    loading: "Loading",
    green: "Green",
    yellow: "Yellow",
    red: "Red",
    error: "Offline",
    left: "Left",
    primary: "5h window",
    primaryShort: "5h",
    secondary: "7d window",
    secondaryShort: "7d",
    plan: "Plan",
    refreshing: "Reading",
    updated: "60s refresh",
    failed: "Unable to read quota. Click refresh.",
    noData: "No data",
    deadline: "until",
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
