<template>
  <header class="navbar" id="app-navbar">
    <div class="navbar-container">
      <!-- Brand Logo -->
      <div class="brand">
        <router-link to="/dashboard" class="brand-link">
          <div class="logo-box">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path d="M7 12.5L10.5 16L17 8.5" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="brand-name">TaskManage</span>
        </router-link>
        <span v-if="authStore.user?.department_name" class="dept-badge">
          {{ authStore.user.department_name }}
        </span>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-links">
        <router-link to="/dashboard" class="nav-item">
          <span>Dashboard</span>
        </router-link>
        <router-link to="/tasks" class="nav-item">
          <span>Manajemen Tugas</span>
        </router-link>
        <router-link
          v-if="authStore.isKadep || authStore.isAdmin"
          to="/team"
          class="nav-item"
        >
          <span>Tim Departemen</span>
        </router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin/departments"
          class="nav-item"
        >
          <span>Departemen</span>
        </router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin/users"
          class="nav-item"
        >
          <span>Pengguna</span>
        </router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin/audit-logs"
          class="nav-item"
        >
          <span>Jejak Audit</span>
        </router-link>
      </nav>

      <!-- User Actions -->
      <div class="user-actions">
        <button class="user-profile-btn" @click="showProfile = true" title="Pengaturan Akun">
          <div class="avatar">
            {{ userInitials }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.full_name || 'Pengguna' }}</span>
            <span class="role-tag" :class="roleClass">{{ roleLabel }}</span>
          </div>
        </button>

        <button class="btn btn-secondary btn-sm" @click="handleLogout" title="Keluar">
          Keluar
        </button>
      </div>
    </div>

    <!-- Profile Modal -->
    <ProfileModal v-if="showProfile" @close="showProfile = false" />
  </header>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.js";
import { useToastStore } from "../../stores/toast.js";
import ProfileModal from "./ProfileModal.vue";

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const showProfile = ref(false);

const userInitials = computed(() => {
  if (!authStore.user?.full_name) return "U";
  return authStore.user.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

const roleLabel = computed(() => {
  switch (authStore.user?.role) {
    case "ADMIN":
      return "Administrator";
    case "HEAD_OF_DEPARTMENT":
      return "Kepala Departemen";
    case "MEMBER":
      return "Anggota Tim";
    default:
      return "Pengguna";
  }
});

const roleClass = computed(() => {
  switch (authStore.user?.role) {
    case "ADMIN":
      return "role-admin";
    case "HEAD_OF_DEPARTMENT":
      return "role-kadep";
    default:
      return "role-member";
  }
});

const handleLogout = async () => {
  await authStore.logout();
  toastStore.showInfo("Anda telah keluar dari aplikasi.");
  router.push({ name: "Login" });
};
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 40;
}

.navbar-container {
  max-width: 1380px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-main);
  text-decoration: none;
}

.logo-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1e1b4b, #4338ca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dept-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
  background-color: #eff6ff;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #bfdbfe;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-item:hover {
  color: var(--color-primary);
  background-color: var(--bg-muted);
}

.nav-item.router-link-active {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  font-weight: 600;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: 1px solid transparent;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.user-profile-btn:hover {
  background-color: var(--bg-muted);
  border-color: var(--border-color);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-main);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-tag {
  font-size: 0.68rem;
  font-weight: 600;
}

.role-kadep {
  color: #0284c7;
}
.role-admin {
  color: #7c3aed;
}
.role-member {
  color: #059669;
}
</style>
