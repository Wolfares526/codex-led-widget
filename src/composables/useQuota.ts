import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { QuotaSnapshot, QuotaWindow } from "../types/quota";
import { useLocale } from "./useLocale";

export type VisualState = "loading" | "green" | "yellow" | "red" | "error";

const REFRESH_INTERVAL_MS = 60_000;
const TIMER_INTERVAL_MS = 30_000;

export function useQuota() {
  const { copy, language } = useLocale();
  const quota = ref<QuotaSnapshot | null>(null);
  const error = ref<unknown>(null);
  const isLoading = ref(false);
  const tick = ref(Date.now());

  const percent = computed(() => {
    const value = quota.value?.remainingPercent;
    return Number.isFinite(value) ? Number(value) : 0;
  });

  const state = computed<VisualState>(() => {
    if (isLoading.value && !quota.value) return "loading";
    if (error.value) return "error";
    if (percent.value <= 0) return "red";
    if (percent.value < 10) return "yellow";
    return "green";
  });

  const stateText = computed(() => {
    if (state.value === "loading") return copy.value.loading;
    return copy.value[state.value];
  });

  const statusText = computed(() => {
    if (isLoading.value) return copy.value.refreshing;
    if (error.value) return copy.value.failed;
    return copy.value.updated;
  });

  const primaryText = computed(() => formatWindow(quota.value?.primary ?? null));
  const secondaryText = computed(() => formatWindow(quota.value?.secondary ?? null));
  const planText = computed(() => String(quota.value?.planType || "--").toUpperCase());

  async function refreshQuota() {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;

    try {
      quota.value = await invoke<QuotaSnapshot>("get_quota");
    } catch (caught) {
      error.value = caught;
      console.error("Failed to read Codex quota:", caught);
    } finally {
      isLoading.value = false;
    }
  }

  function formatWindow(window: QuotaWindow | null) {
    if (!window) return copy.value.noData;
    const reset = formatDuration(window.resetsAt);
    return language.value === "en"
      ? `${window.remainingPercent}% · ${reset} ${copy.value.after}`
      : `${window.remainingPercent}% · ${reset}${copy.value.after}`;
  }

  function formatDuration(resetsAt: string | null) {
    tick.value;
    if (!resetsAt) return copy.value.noData;

    const remainingMs = Math.max(0, new Date(resetsAt).getTime() - Date.now());
    const totalMinutes = Math.ceil(remainingMs / 60_000);
    const days = Math.floor(totalMinutes / 1_440);
    const hours = Math.floor((totalMinutes % 1_440) / 60);
    const minutes = totalMinutes % 60;

    if (language.value === "en") {
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }

    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分`;
    return `${minutes}分钟`;
  }

  let refreshTimer: number | undefined;
  let tickTimer: number | undefined;
  let unlistenRefresh: UnlistenFn | undefined;

  onMounted(() => {
    refreshQuota();
    refreshTimer = window.setInterval(refreshQuota, REFRESH_INTERVAL_MS);
    tickTimer = window.setInterval(() => {
      tick.value = Date.now();
    }, TIMER_INTERVAL_MS);
    listen("quota://refresh", refreshQuota).then((unlisten) => {
      unlistenRefresh = unlisten;
    });
  });

  onUnmounted(() => {
    window.clearInterval(refreshTimer);
    window.clearInterval(tickTimer);
    unlistenRefresh?.();
  });

  watchEffect(() => {
    document.body.dataset.state = state.value;
  });

  return {
    error,
    isLoading,
    percent,
    planText,
    primaryText,
    quota,
    refreshQuota,
    secondaryText,
    state,
    stateText,
    statusText
  };
}
