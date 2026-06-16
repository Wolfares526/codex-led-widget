<script setup lang="ts">
defineProps<{
  primaryLabel: string;
  primaryText: string;
  secondaryLabel: string;
  secondaryText: string;
  planLabel: string;
  planText: string;
}>();
</script>

<template>
  <div class="quota-panel">
    <div class="quota-card primary">
      <span>{{ primaryLabel }}</span>
      <strong>{{ primaryText }}</strong>
    </div>
    <div class="quota-card">
      <span>{{ secondaryLabel }}</span>
      <strong>{{ secondaryText }}</strong>
    </div>
    <div class="quota-card slim">
      <span>{{ planLabel }}</span>
      <strong>{{ planText }}</strong>
    </div>
  </div>
</template>
