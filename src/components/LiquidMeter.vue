<script setup lang="ts">
withDefaults(
  defineProps<{
    displayValue: string;
    percent?: number;
    remainingLabel: string;
  }>(),
  {
    percent: 0
  }
);

defineEmits<{
  toggleWindow: [];
}>();
</script>

<template>
  <button class="liquid-meter" type="button" aria-label="切换 5小时和7天额度展示" @click="$emit('toggleWindow')">
    <div class="glass-rim"></div>
    <div class="liquid-fill" :style="{ '--level': `${Math.max(5, percent)}%` }">
      <div class="wave wave-one"></div>
      <div class="wave wave-two"></div>
    </div>
    <div class="shine"></div>
    <div class="meter-copy">
      <strong>{{ displayValue }}%</strong>
      <span>{{ remainingLabel }}</span>
    </div>
  </button>
</template>
