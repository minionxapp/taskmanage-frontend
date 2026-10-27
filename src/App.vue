<template>
  <div class="app-layout">
    <AppNavbar v-if="authStore.isAuthenticated" />
    <main class="main-content" :class="{ 'auth-screen': !authStore.isAuthenticated }">
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth.js";
import AppNavbar from "./components/common/AppNavbar.vue";
import ToastContainer from "./components/common/ToastContainer.vue";

const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchProfile();
  }
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content.auth-screen {
  padding: 0;
}
</style>
