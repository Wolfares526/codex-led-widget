<script setup lang="ts">
defineProps<{
  state: "loading" | "green" | "yellow" | "red" | "error";
  text: string;
}>();
</script>

<template>
  <footer class="status">
    <span class="status-dot" :class="state"></span>
    <span>{{ text }}</span>
  </footer>
</template>
