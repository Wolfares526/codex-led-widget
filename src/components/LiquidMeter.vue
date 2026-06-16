<script setup lang="ts">
withDefaults(
  defineProps<{
    percent?: number;
    remainingLabel: string;
  }>(),
  {
    percent: 0
  }
);
</script>

<template>
  <div class="liquid-meter" aria-label="Codex 剩余额度">
    <div class="glass-rim"></div>
    <div class="liquid-fill" :style="{ '--level': `${Math.max(5, percent)}%` }">
      <div class="wave wave-one"></div>
      <div class="wave wave-two"></div>
    </div>
    <div class="shine"></div>
    <div class="meter-copy">
      <strong>{{ percent }}%</strong>
      <span>{{ remainingLabel }}</span>
    </div>
  </div>
</template>
