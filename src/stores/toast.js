import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const toasts = ref([]);

  const addToast = (message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const showSuccess = (message) => addToast(message, "success");
  const showError = (message) => addToast(message, "danger", 5000);
  const showWarning = (message) => addToast(message, "warning");
  const showInfo = (message) => addToast(message, "info");

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    addToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    removeToast,
  };
});
