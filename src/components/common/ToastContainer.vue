<template>
  <div class="toast-container" id="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="toastStore.removeToast(toast.id)"
      >
        <span class="toast-indicator"></span>
        <div class="toast-body">{{ toast.message }}</div>
        <button class="toast-close" aria-label="Tutup">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from "../../stores/toast.js";

const toastStore = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 380px;
}

.toast-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.toast-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.toast-success .toast-indicator {
  background-color: var(--color-success);
}
.toast-danger .toast-indicator {
  background-color: var(--color-danger);
}
.toast-warning .toast-indicator {
  background-color: var(--color-warning);
}
.toast-info .toast-indicator {
  background-color: var(--color-info);
}

.toast-body {
  flex: 1;
  padding-left: 0.5rem;
  color: var(--text-main);
  font-weight: 500;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0 0.25rem;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>
