import { computed, ref } from "vue";

type Language = "zh" | "en";

const messages = {
  zh: {
    brand: "Codex",
    left: "剩余",
    primaryShort: "5小时",
    secondaryShort: "7天",
    refreshing: "读取中",
    updated: "60秒刷新",
    failed: "读取失败，点击刷新重试",
    deadline: "截止",
    pinned: "取消置顶",
    unpinned: "置顶",
    refresh: "刷新",
    hide: "隐藏"
  },
  en: {
    brand: "Codex",
    left: "Left",
    primaryShort: "5h",
    secondaryShort: "7d",
    refreshing: "Reading",
    updated: "60s refresh",
    failed: "Unable to read quota. Click refresh.",
    deadline: "until",
    pinned: "Unpin",
    unpinned: "Pin",
    refresh: "Refresh",
    hide: "Hide"
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
