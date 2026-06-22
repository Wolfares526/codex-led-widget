<script setup lang="ts">
import LiquidMeter from "./components/LiquidMeter.vue";
import StatusBar from "./components/StatusBar.vue";
import TitleBar from "./components/TitleBar.vue";
import { useLocale } from "./composables/useLocale";
import { useQuota } from "./composables/useQuota";
import { useWindowControls } from "./composables/useWindowControls";

const { copy, language, toggleLanguage } = useLocale();
const {
  displayDeadlineText,
  displayPercent,
  displayWindowLabel,
  isLoading,
  percent,
  planText,
  refreshQuota,
  state,
  statusText,
  toggleDisplayWindow
} = useQuota();
const { hideWindow, isPinned, togglePinned } = useWindowControls();
</script>

<template>
  <main class="widget" data-tauri-drag-region>
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <TitleBar
      :brand="copy.brand"
      :plan-text="planText"
      :state="state"
      :language-label="language === 'zh' ? 'EN' : '中'"
      :is-pinned="isPinned"
      :pin-label="isPinned ? copy.pinned : copy.unpinned"
      :refresh-label="copy.refresh"
      :is-refreshing="isLoading"
      :hide-label="copy.hide"
      @toggle-language="toggleLanguage"
      @toggle-pinned="togglePinned"
      @refresh="refreshQuota"
      @hide="hideWindow"
    />

    <section class="content">
      <LiquidMeter
        :display-value="displayPercent"
        :percent="percent"
        :remaining-label="displayWindowLabel"
        @toggle-window="toggleDisplayWindow"
      />
      <div class="deadline-row" aria-live="polite">{{ displayDeadlineText }}</div>
    </section>

    <StatusBar :state="state" :text="statusText" />
  </main>
</template>
