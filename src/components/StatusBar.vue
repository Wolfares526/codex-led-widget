<script setup lang="ts">
defineProps<{
  state: "loading" | "green" | "yellow" | "red" | "error";
  text: string;
}>();
</script>

<template>
  <footer class="status" aria-live="polite">
    <span class="status-dot" :class="state"></span>
    <span>{{ text }}</span>
  </footer>
</template>
