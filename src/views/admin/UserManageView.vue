<template>
  <div class="user-manage-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Pengguna Sistem</h1>
        <p class="page-subtitle">Kelola akun karyawan, hak akses peran (RBAC), dan reset kredensial</p>
      </div>

      <button class="btn btn-primary" @click="showCreateModal = true">
        + Tambah Pengguna Baru
      </button>
    </div>

    <!-- Users Table Card -->
    <div class="card table-card">
      <div class="table-card-header">
        <h3 class="card-title">Daftar Akun Pengguna ({{ users.length }})</h3>
        <button class="btn btn-secondary btn-sm" @click="loadUsers">🔄 Refresh</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat daftar pengguna...</p>
      </div>

      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <p>Belum ada data pengguna</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama & Telepon</th>
              <th>Email</th>
              <th>Peran (Role)</th>
              <th>Status Akun</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-info-cell">
                  <div class="avatar-cell">{{ getInitials(user.full_name) }}</div>
                  <div>
                    <div class="user-fullname">{{ user.full_name }}</div>
                    <div class="user-phone">{{ user.phone_number || "-" }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(user.role)">
                  {{ formatRole(user.role) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="user.status === 'ACTIVE' ? 'badge-done' : 'badge-urgent'">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="actions-cell">
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click="openChangeRoleModal(user)"
                    title="Ubah Peran"
                  >
                    Role
                  </button>
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click="openResetPasswordModal(user)"
                    title="Reset Sandi"
                  >
                    Reset Sandi
                  </button>
                  <button 
                    v-if="user.status === 'ACTIVE' && user.id !== currentAdmin?.id"
                    class="btn btn-danger btn-sm" 
                    @click="handleDeactivate(user)"
                    title="Nonaktifkan Pengguna"
                  >
                    Nonaktifkan
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create User -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Tambah Pengguna Baru</h3>
          <button class="close-btn" @click="showCreateModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleCreateUser" class="modal-body">
          <div class="form-group">
            <label class="form-label" for="user-fullname">Nama Lengkap <span class="required">*</span></label>
            <input 
              id="user-fullname" 
              v-model="createForm.full_name" 
              type="text" 
              class="form-control" 
              placeholder="Contoh: Budi Pratama"
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="user-email">Email Perusahaan <span class="required">*</span></label>
            <input 
              id="user-email" 
              v-model="createForm.email" 
              type="email" 
              class="form-control" 
              placeholder="budi@company.com"
              required 
            />
          </div>

          <div class="form-group">
            <div class="password-label-row">
              <label class="form-label" for="user-password">Kata Sandi Awal <span class="required">*</span></label>
              <button 
                type="button" 
                class="btn-text-sm" 
                @click="createForm.password = 'P@ssw0rd123!'"
                title="Gunakan kata sandi rekomendasi sistem"
              >
                Gunakan Rekomendasi (P@ssw0rd123!)
              </button>
            </div>
            <div class="input-password-wrapper">
              <input 
                id="user-password" 
                v-model="createForm.password" 
                :type="showPassword ? 'text' : 'password'" 
                class="form-control" 
                placeholder="Minimal 6 karakter (cth: P@ssw0rd123!)"
                required 
              />
              <button 
                type="button" 
                class="password-toggle-btn" 
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <small class="form-hint" style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
              Minimal 6 karakter. Klik "Gunakan Rekomendasi" untuk mengisi otomatis kata sandi standar.
            </small>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="user-role">Peran Sistem</label>
              <select id="user-role" v-model="createForm.role" class="form-control">
                <option value="MEMBER">Anggota Tim (Member)</option>
                <option value="HEAD_OF_DEPARTMENT">Kepala Departemen</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="user-phone">Nomor Telepon</label>
              <input 
                id="user-phone" 
                v-model="createForm.phone_number" 
                type="text" 
                class="form-control" 
                placeholder="081234567890" 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="user-dept">Departemen Penugasan</label>
            <select id="user-dept" v-model="createForm.department_id" class="form-control">
              <option value="">-- Tanpa Departemen Awal --</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
            <small class="form-hint" style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
              Pengguna akan otomatis terdaftar sebagai anggota departemen yang dipilih.
            </small>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? "Menyimpan..." : "Simpan Pengguna" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Change Role -->
    <div v-if="showRoleModal" class="modal-overlay" @click.self="showRoleModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Ubah Peran: {{ targetUser?.full_name }}</h3>
          <button class="close-btn" @click="showRoleModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Pilih Peran Baru</label>
            <select v-model="newRole" class="form-control">
              <option value="MEMBER">Anggota Tim (Member)</option>
              <option value="HEAD_OF_DEPARTMENT">Kepala Departemen</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showRoleModal = false">Batal</button>
            <button class="btn btn-primary" @click="handleUpdateRole" :disabled="submitting">
              Simpan Peran
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Reset Password -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Reset Kata Sandi: {{ targetUser?.full_name }}</h3>
          <button class="close-btn" @click="showResetModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Kata Sandi Baru</label>
            <input 
              v-model="newPassword" 
              type="password" 
              class="form-control" 
              placeholder="Minimal 8 karakter..."
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showResetModal = false">Batal</button>
            <button class="btn btn-danger" @click="handleResetPassword" :disabled="!newPassword || submitting">
              Reset Sandi Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useToastStore } from "../../stores/toast.js";
import { userApi, departmentApi } from "../../api/common-api.js";

const authStore = useAuthStore();
const toastStore = useToastStore();

const currentAdmin = computed(() => authStore.user);

const users = ref([]);
const departments = ref([]);
const loading = ref(false);
const submitting = ref(false);
const showPassword = ref(false);

const showCreateModal = ref(false);
const showRoleModal = ref(false);
const showResetModal = ref(false);

const targetUser = ref(null);
const newRole = ref("MEMBER");
const newPassword = ref("");

const createForm = reactive({
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  role: "MEMBER",
  department_id: "",
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const [usersRes, deptsRes] = await Promise.all([
      userApi.listUsers(),
      departmentApi.listDepartments(),
    ]);
    users.value = usersRes.data || [];
    departments.value = deptsRes.data || [];
  } catch (err) {
    toastStore.error(err.message || "Gagal memuat data pengguna atau departemen");
  } finally {
    loading.value = false;
  }
};

const handleCreateUser = async () => {
  submitting.value = true;
  try {
    await userApi.createUser({
      full_name: createForm.full_name,
      email: createForm.email,
      password: createForm.password,
      phone_number: createForm.phone_number || undefined,
      role: createForm.role,
      department_id: createForm.department_id || undefined,
    });
    toastStore.success("Pengguna baru berhasil dibuat!");
    showCreateModal.value = false;
    createForm.full_name = "";
    createForm.email = "";
    createForm.password = "";
    createForm.phone_number = "";
    createForm.role = "MEMBER";
    createForm.department_id = "";
    showPassword.value = false;
    await loadUsers();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal membuat pengguna");
  } finally {
    submitting.value = false;
  }
};

const openChangeRoleModal = (user) => {
  targetUser.value = user;
  newRole.value = user.role;
  showRoleModal.value = true;
};

const handleUpdateRole = async () => {
  submitting.value = true;
  try {
    await userApi.updateRole(targetUser.value.id, newRole.value);
    toastStore.success(`Peran ${targetUser.value.full_name} berhasil diubah.`);
    showRoleModal.value = false;
    await loadUsers();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal mengubah peran");
  } finally {
    submitting.value = false;
  }
};

const openResetPasswordModal = (user) => {
  targetUser.value = user;
  newPassword.value = "";
  showResetModal.value = true;
};

const handleResetPassword = async () => {
  if (!newPassword.value) return;
  submitting.value = true;
  try {
    await userApi.resetPassword(targetUser.value.id, newPassword.value);
    toastStore.success(`Kata sandi ${targetUser.value.full_name} berhasil di-reset.`);
    showResetModal.value = false;
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal reset kata sandi");
  } finally {
    submitting.value = false;
  }
};

const handleDeactivate = async (user) => {
  if (!confirm(`Nonaktifkan akun ${user.full_name}? Pengguna ini tidak akan bisa login lagi.`)) return;
  try {
    await userApi.deactivateUser(user.id);
    toastStore.success(`Akun ${user.full_name} berhasil dinonaktifkan.`);
    await loadUsers();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal menonaktifkan pengguna");
  }
};

onMounted(async () => {
  await loadUsers();
});

const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const formatRole = (role) => {
  if (role === "HEAD_OF_DEPARTMENT") return "Kepala Departemen";
  if (role === "ADMIN") return "Administrator";
  return "Anggota Tim";
};

const getRoleBadgeClass = (role) => {
  if (role === "HEAD_OF_DEPARTMENT") return "badge-progress";
  if (role === "ADMIN") return "badge-urgent";
  return "badge-todo";
};
</script>

<style scoped>
.user-manage-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  background: #f8fafc;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.data-table th {
  background: #f8fafc;
  padding: 0.85rem 1.25rem;
  font-weight: 700;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.data-table td {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-cell {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-fullname {
  font-weight: 600;
  color: var(--text-main);
}

.user-phone {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.actions-cell {
  display: flex;
  gap: 0.4rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.required {
  color: var(--color-danger);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.password-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.password-label-row .form-label {
  margin-bottom: 0;
}

.btn-text-sm {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-text-sm:hover {
  color: #3730a3;
}

.input-password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-password-wrapper .form-control {
  padding-right: 2.5rem;
  width: 100%;
}

.password-toggle-btn {
  position: absolute;
  right: 0.65rem;
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem;
  line-height: 1;
}
</style>
