<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Brand & Hero -->
      <div class="brand-header">
        <div class="brand-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h1 class="brand-title">TaskFlow Enterprise</h1>
        <p class="brand-tagline">Sistem Manajemen Tugas Departemen Berstandar Audit & Persetujuan Dua Pintu</p>
      </div>

      <!-- Main Login Card -->
      <div class="card login-card">
        <h2 class="card-title">Masuk ke Akun Anda</h2>
        <p class="card-subtitle">Silakan masukkan email dan kata sandi Anda</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Alamat Email Perusahaan</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="form-control"
              placeholder="nama@company.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="login-password">Kata Sandi</label>
              <button type="button" class="toggle-pwd-btn" @click="showPassword = !showPassword">
                {{ showPassword ? "Sembunyikan" : "Tampilkan" }}
              </button>
            </div>
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="••••••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !email || !password">
            <span v-if="loading" class="spinner-sm"></span>
            {{ loading ? "Memverifikasi..." : "Masuk ke Sistem" }}
          </button>
        </form>

        <!-- Quick Demo Accounts Helper -->
        <div class="demo-accounts-section">
          <div class="demo-divider">
            <span>Uji Coba Akun Default (Demo)</span>
          </div>
          <div class="demo-buttons-grid">
            <button 
              type="button" 
              class="demo-btn admin"
              @click="fillCredentials('admin@company.com', 'P@ssw0rd123!', true)"
              :disabled="loading"
            >
              <span class="demo-role">Administrator</span>
              <span class="demo-email">admin@company.com</span>
            </button>
            <button 
              type="button" 
              class="demo-btn kadep"
              @click="fillCredentials('kadep@company.com', 'P@ssw0rd123!', true)"
              :disabled="loading"
            >
              <span class="demo-role">Kepala Departemen</span>
              <span class="demo-email">kadep@company.com</span>
            </button>
            <button 
              type="button" 
              class="demo-btn member"
              @click="fillCredentials('member1@company.com', 'P@ssw0rd123!', true)"
              :disabled="loading"
            >
              <span class="demo-role">Anggota Tim 1</span>
              <span class="demo-email">member1@company.com</span>
            </button>
            <button 
              type="button" 
              class="demo-btn member"
              @click="fillCredentials('member2@company.com', 'P@ssw0rd123!', true)"
              :disabled="loading"
            >
              <span class="demo-role">Anggota Tim 2</span>
              <span class="demo-email">member2@company.com</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="login-footer">
        <p>© 2026 TaskFlow. Dilindungi enkripsi JWT & pencatatan audit Winston.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth.js";
import { useToastStore } from "../../stores/toast.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

onMounted(() => {
  if (authStore.isAuthenticated) {
    const target = (route.query.redirect && route.query.redirect !== "/login") ? route.query.redirect : "/dashboard";
    router.replace(target);
  }
});

const fillCredentials = async (em, pw, autoSubmit = false) => {
  email.value = em;
  password.value = pw;
  if (autoSubmit) {
    await handleLogin();
  }
};

const handleLogin = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const authData = await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });
    const userName = authData?.user?.full_name || authData?.user?.name || "Pengguna";
    toastStore.showSuccess(`Selamat datang kembali, ${userName}!`);

    const redirectPath = (route.query.redirect && route.query.redirect !== "/login")
      ? route.query.redirect
      : "/dashboard";
    
    // Langsung tutup form login dan navigasikan ke halaman tujuan
    await router.replace(redirectPath);
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Email atau kata sandi tidak valid";
    toastStore.showError(msg);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, #e0e7ff, transparent 50%),
              radial-gradient(circle at bottom left, #ecfeff, transparent 50%),
              #f8fafc;
  padding: 1.5rem;
}

.login-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25);
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
}

.brand-tagline {
  font-size: 0.8125rem;
  color: var(--text-muted);
  max-width: 380px;
  line-height: 1.4;
}

.login-card {
  padding: 2rem;
  border-radius: var(--radius-lg);
  background: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.card-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-pwd-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--color-primary);
  cursor: pointer;
}
.toggle-pwd-btn:hover {
  text-decoration: underline;
}

.btn-block {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem;
  font-size: 0.9375rem;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.demo-accounts-section {
  margin-top: 1.75rem;
}

.demo-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 1rem;
}

.demo-divider::before,
.demo-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.demo-divider span {
  padding: 0 0.75rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.demo-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.6rem 0.75rem;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.demo-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  transform: translateY(-1px);
}

.demo-role {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-main);
}

.demo-email {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.demo-btn.admin .demo-role { color: #dc2626; }
.demo-btn.kadep .demo-role { color: #4f46e5; }
.demo-btn.member .demo-role { color: #0284c7; }

.login-footer {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
