import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "../api/auth-api.js";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("tm_access_token") || null);
  const user = ref(JSON.parse(localStorage.getItem("tm_user") || "null"));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isKadep = computed(() => user.value?.role === "HEAD_OF_DEPARTMENT");
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isMember = computed(() => user.value?.role === "MEMBER");

  const login = async (credentials) => {
    loading.value = true;
    try {
      const response = await authApi.login(credentials);
      const authData = response.data;
      token.value = authData.token;
      user.value = authData.user;

      localStorage.setItem("tm_access_token", authData.token);
      localStorage.setItem("tm_user", JSON.stringify(authData.user));
      return authData;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout();
      }
    } catch {
      // Abaikan error saat logout
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem("tm_access_token");
      localStorage.removeItem("tm_user");
    }
  };

  const fetchProfile = async () => {
    if (!token.value) return null;
    try {
      const res = await authApi.getProfile();
      user.value = { ...user.value, ...res.data };
      localStorage.setItem("tm_user", JSON.stringify(user.value));
      return user.value;
    } catch (err) {
      console.error("Gagal fetch profile:", err);
      return null;
    }
  };

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isKadep,
    isAdmin,
    isMember,
    login,
    logout,
    fetchProfile,
  };
});
