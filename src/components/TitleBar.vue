<script setup lang="ts">
defineProps<{
  brand: string;
  planText: string;
  state: "loading" | "green" | "yellow" | "red" | "error";
  isPinned: boolean;
  languageLabel: string;
  pinLabel: string;
  refreshLabel: string;
  isRefreshing: boolean;
  hideLabel: string;
}>();

defineEmits<{
  hide: [];
  refresh: [];
  toggleLanguage: [];
  togglePinned: [];
}>();
</script>

<template>
  <header class="titlebar" data-tauri-drag-region>
    <div class="brand" data-tauri-drag-region>
      <span class="traffic-light" :class="state" aria-hidden="true"></span>
      <div data-tauri-drag-region>
        <span class="brand-name">{{ brand }}</span>
        <span class="plan-chip">{{ planText }}</span>
      </div>
    </div>
    <div class="window-actions" aria-label="Window controls">
      <button class="text-button" title="Language" aria-label="Language" @click="$emit('toggleLanguage')">
        {{ languageLabel }}
      </button>
      <button
        class="icon-button"
        :class="{ active: isPinned }"
        :title="pinLabel"
        :aria-label="pinLabel"
        @click="$emit('togglePinned')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4l6 6-3 1-4 4v4l-2 2-2-6-6-2 2-2h4l4-4 1-3z" />
        </svg>
      </button>
      <button
        class="icon-button"
        :class="{ loading: isRefreshing }"
        :disabled="isRefreshing"
        :title="refreshLabel"
        :aria-label="refreshLabel"
        @click="$emit('refresh')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12a8 8 0 0 1-13.7 5.7M4 12A8 8 0 0 1 17.7 6.3M17 3v4h-4M7 21v-4h4" />
        </svg>
      </button>
      <button class="icon-button" :title="hideLabel" :aria-label="hideLabel" @click="$emit('hide')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  </header>
</template>
