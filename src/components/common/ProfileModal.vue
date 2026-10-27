<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title">Profil & Pengaturan Akun</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            Informasi Pribadi
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'password' }"
            @click="activeTab = 'password'"
          >
            Ubah Kata Sandi
          </button>
        </div>

        <!-- Tab Profile -->
        <form v-if="activeTab === 'profile'" @submit.prevent="handleUpdateProfile">
          <div class="form-group">
            <label class="form-label">Alamat Email</label>
            <input type="text" class="form-control" :value="authStore.user?.email" disabled />
            <small style="color: var(--text-muted); font-size: 0.75rem;">Email akun tidak dapat diubah secara sepihak demi kepatuhan audit.</small>
          </div>

          <div class="form-group">
            <label class="form-label">Peran Sistem (Role)</label>
            <input type="text" class="form-control" :value="authStore.user?.role" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input v-model="profileForm.full_name" type="text" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">Nomor Telepon / Kontak</label>
            <input v-model="profileForm.phone_number" type="text" class="form-control" placeholder="08..." />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </form>

        <!-- Tab Password -->
        <form v-else @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">Kata Sandi Saat Ini</label>
            <input v-model="passwordForm.old_password" type="password" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">Kata Sandi Baru</label>
            <input v-model="passwordForm.new_password" type="password" class="form-control" required />
            <small style="color: var(--text-muted); font-size: 0.75rem;">
              Minimal 8 karakter, harus memuat huruf besar, huruf kecil, dan angka.
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Konfirmasi Kata Sandi Baru</label>
            <input v-model="passwordForm.confirm_password" type="password" class="form-control" required />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? "Memproses..." : "Perbarui Kata Sandi" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useToastStore } from "../../stores/toast.js";
import { authApi } from "../../api/auth-api.js";

const emit = defineEmits(["close"]);
const authStore = useAuthStore();
const toastStore = useToastStore();

const activeTab = ref("profile");
const loading = ref(false);

const profileForm = reactive({
  full_name: "",
  phone_number: "",
});

const passwordForm = reactive({
  old_password: "",
  new_password: "",
  confirm_password: "",
});

onMounted(() => {
  if (authStore.user) {
    profileForm.full_name = authStore.user.full_name || "";
    profileForm.phone_number = authStore.user.phone_number || "";
  }
});

const handleUpdateProfile = async () => {
  loading.value = true;
  try {
    const res = await authApi.updateProfile({
      full_name: profileForm.full_name,
      phone_number: profileForm.phone_number,
    });
    authStore.user.full_name = res.data.full_name;
    authStore.user.phone_number = res.data.phone_number;
    localStorage.setItem("tm_user", JSON.stringify(authStore.user));
    toastStore.showSuccess("Profil berhasil diperbarui!");
    emit("close");
  } catch (err) {
    toastStore.showError(err.message);
  } finally {
    loading.value = false;
  }
};

const handleChangePassword = async () => {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    toastStore.showError("Konfirmasi kata sandi baru tidak cocok.");
    return;
  }

  loading.value = true;
  try {
    await authApi.changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    });
    toastStore.showSuccess("Kata sandi berhasil diubah!");
    emit("close");
  } catch (err) {
    toastStore.showError(err.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}
.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}
.modal-body {
  padding: 1.5rem;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.25rem;
}
.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-muted);
  cursor: pointer;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.modal-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
