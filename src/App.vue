<script setup lang="ts">
import LiquidMeter from "./components/LiquidMeter.vue";
import QuotaPanel from "./components/QuotaPanel.vue";
import StatusBar from "./components/StatusBar.vue";
import TitleBar from "./components/TitleBar.vue";
import { useLocale } from "./composables/useLocale";
import { useQuota } from "./composables/useQuota";
import { useWindowControls } from "./composables/useWindowControls";

const { copy, language, toggleLanguage } = useLocale();
const {
  percent,
  planText,
  primaryText,
  refreshQuota,
  secondaryText,
  state,
  stateText,
  statusText
} = useQuota();
const { closeApp, hideWindow, isPinned, togglePinned } = useWindowControls();
</script>

<template>
  <main class="widget">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <TitleBar
      :brand="copy.brand"
      :state="state"
      :state-text="stateText"
      :language-label="language === 'zh' ? 'EN' : '中'"
      :is-pinned="isPinned"
      :pin-label="isPinned ? copy.pinned : copy.unpinned"
      :refresh-label="copy.refresh"
      :hide-label="copy.hide"
      :close-label="copy.close"
      @toggle-language="toggleLanguage"
      @toggle-pinned="togglePinned"
      @refresh="refreshQuota"
      @hide="hideWindow"
      @close="closeApp"
    />

    <section class="content">
      <LiquidMeter :percent="percent" :remaining-label="copy.left" />
      <QuotaPanel
        :primary-label="copy.primary"
        :primary-text="primaryText"
        :secondary-label="copy.secondary"
        :secondary-text="secondaryText"
        :plan-label="copy.plan"
        :plan-text="planText"
      />
    </section>

    <StatusBar :state="state" :text="statusText" />
  </main>
</template>
