<script setup lang="ts">
defineProps<{
  brand: string;
  state: "loading" | "green" | "yellow" | "red" | "error";
  stateText: string;
  isPinned: boolean;
  languageLabel: string;
  pinLabel: string;
  refreshLabel: string;
  hideLabel: string;
  closeLabel: string;
}>();

defineEmits<{
  close: [];
  hide: [];
  refresh: [];
  toggleLanguage: [];
  togglePinned: [];
}>();
</script>

<template>
  <header class="titlebar">
    <div class="brand">
      <span class="traffic-light" :class="state" aria-hidden="true"></span>
      <div>
        <span class="brand-name">{{ brand }}</span>
        <span class="brand-state">{{ stateText }}</span>
      </div>
    </div>
    <div class="window-actions">
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
      <button class="icon-button" :title="refreshLabel" :aria-label="refreshLabel" @click="$emit('refresh')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12a8 8 0 0 1-13.7 5.7M4 12A8 8 0 0 1 17.7 6.3M17 3v4h-4M7 21v-4h4" />
        </svg>
      </button>
      <button class="icon-button" :title="hideLabel" :aria-label="hideLabel" @click="$emit('hide')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button class="icon-button danger" :title="closeLabel" :aria-label="closeLabel" @click="$emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  </header>
</template>
