import { onMounted, onUnmounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export function useWindowControls() {
  const isPinned = ref(true);
  let unlistenPinned: UnlistenFn | undefined;

  async function togglePinned() {
    isPinned.value = await invoke<boolean>("set_always_on_top", {
      value: !isPinned.value
    });
  }

  function hideWindow() {
    return invoke("hide_window");
  }

  function closeApp() {
    return invoke("close_app");
  }

  onMounted(() => {
    listen<boolean>("window://always-on-top-changed", (event) => {
      isPinned.value = event.payload;
    }).then((unlisten) => {
      unlistenPinned = unlisten;
    });
  });

  onUnmounted(() => {
    unlistenPinned?.();
  });

  return {
    closeApp,
    hideWindow,
    isPinned,
    togglePinned
  };
}
