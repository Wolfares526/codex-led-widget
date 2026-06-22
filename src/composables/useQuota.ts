import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { QuotaSnapshot } from "../types/quota";
import { useLocale } from "./useLocale";

export type VisualState = "loading" | "green" | "yellow" | "red" | "error";

const REFRESH_INTERVAL_MS = 60_000;

export function useQuota() {
  const { copy } = useLocale();
  const quota = ref<QuotaSnapshot | null>(null);
  const error = ref<unknown>(null);
  const isLoading = ref(false);
  const activeWindowKind = ref<"primary" | "secondary">("primary");
  const hasLoadedQuota = ref(false);

  const activeWindow = computed(() => {
    const snapshot = quota.value;
    if (!snapshot) return null;
    const preferred = activeWindowKind.value === "primary" ? snapshot.primary : snapshot.secondary;
    return preferred ?? snapshot.primary ?? snapshot.secondary;
  });

  const percent = computed(() => {
    const value = activeWindow.value?.remainingPercent ?? quota.value?.remainingPercent;
    return Number.isFinite(value) ? Number(value) : 0;
  });

  const displayPercent = computed(() => {
    if (!quota.value) return "--";
    return String(percent.value);
  });

  const state = computed<VisualState>(() => {
    if (isLoading.value && !quota.value) return "loading";
    if (error.value) return "error";
    if (percent.value <= 0) return "red";
    if (percent.value < 10) return "yellow";
    return "green";
  });

  const statusText = computed(() => {
    if (isLoading.value) return copy.value.refreshing;
    if (error.value) return copy.value.failed;
    return copy.value.updated;
  });

  const displayWindowLabel = computed(() => {
    if (!quota.value) return copy.value.left;
    const showingPrimary = activeWindow.value === quota.value.primary;
    return showingPrimary ? copy.value.primaryShort : copy.value.secondaryShort;
  });


  const displayDeadlineText = computed(() => {
    const window = activeWindow.value;
    const cutoff = formatCutoffTime(window?.resetsAt ?? null);

    return `${copy.value.deadline} ${cutoff}`;
  });
  const planText = computed(() => String(quota.value?.planType || "--").toUpperCase());

  async function refreshQuota() {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;

    try {
      const nextQuota = await invoke<QuotaSnapshot>("get_quota");
      quota.value = nextQuota;
      activeWindowKind.value = pickNextWindowKind(nextQuota);
      hasLoadedQuota.value = true;
    } catch (caught) {
      quota.value = null;
      error.value = caught;
      console.error("Failed to read Codex quota:", caught);
    } finally {
      isLoading.value = false;
    }
  }

  function pickNextWindowKind(snapshot: QuotaSnapshot): "primary" | "secondary" {
    if (!snapshot.primary && snapshot.secondary) return "secondary";
    if (snapshot.primary && !snapshot.secondary) return "primary";
    if (!hasLoadedQuota.value) return "primary";
    return activeWindowKind.value === "primary" ? "secondary" : "primary";
  }

  function toggleDisplayWindow() {
    const snapshot = quota.value;
    if (!snapshot?.primary || !snapshot.secondary) return;
    activeWindowKind.value = activeWindowKind.value === "primary" ? "secondary" : "primary";
  }

  function formatCutoffTime(resetsAt: string | null) {
    if (!resetsAt) return "--/-- --:--";
    const date = new Date(resetsAt);
    if (Number.isNaN(date.getTime())) return "--/-- --:--";

    const month = padTimePart(date.getMonth() + 1);
    const day = padTimePart(date.getDate());
    const hours = padTimePart(date.getHours());
    const minutes = padTimePart(date.getMinutes());
    return `${month}/${day} ${hours}:${minutes}`;
  }

  function padTimePart(value: number) {
    return String(value).padStart(2, "0");
  }
  let refreshTimer: number | undefined;
  let unlistenRefresh: UnlistenFn | undefined;

  onMounted(() => {
    refreshQuota();
    refreshTimer = window.setInterval(refreshQuota, REFRESH_INTERVAL_MS);
    listen("quota://refresh", refreshQuota).then((unlisten) => {
      unlistenRefresh = unlisten;
    });
  });

  onUnmounted(() => {
    window.clearInterval(refreshTimer);
    unlistenRefresh?.();
  });

  watchEffect(() => {
    document.body.dataset.state = state.value;
  });

  return {
    error,
    displayDeadlineText,
    displayPercent,
    displayWindowLabel,
    isLoading,
    percent,
    planText,
    quota,
    refreshQuota,
    state,
    statusText,
    toggleDisplayWindow
  };
}
