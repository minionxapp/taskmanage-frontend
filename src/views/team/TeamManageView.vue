<template>
  <div class="team-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Anggota Tim Departemen</h1>
        <p class="page-subtitle">
          Kelola susunan anggota tim departemen, alokasi penugasan, dan izin akses kerja
        </p>
      </div>

      <button class="btn btn-primary" @click="showAddModal = true">
        + Tambah Anggota ke Tim
      </button>
    </div>

    <!-- Overview Stats -->
    <div class="stats-row">
      <div class="card stat-box">
        <span class="stat-num">{{ members.length }}</span>
        <span class="stat-label">Total Anggota Terdaftar</span>
      </div>
      <div class="card stat-box">
        <span class="stat-num">{{ totalActiveTasksInTeam }}</span>
        <span class="stat-label">Total Tugas Aktif Berjalan</span>
      </div>
    </div>

    <!-- Members Table Card -->
    <div class="card table-card">
      <div class="table-card-header">
        <h3 class="card-title">Daftar Anggota Departemen Saat Ini</h3>
        <button class="btn btn-secondary btn-sm" @click="loadMembers">
          🔄 Refresh
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat daftar anggota tim...</p>
      </div>

      <div v-else-if="members.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Belum Ada Anggota Terdaftar</h3>
        <p>Departemen ini belum memiliki anggota bawahan. Klik tombol Tambah Anggota di atas.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama & Profil</th>
              <th>Alamat Email</th>
              <th>Peran Akun</th>
              <th>Tugas Aktif</th>
              <th>Tanggal Bergabung</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td>
                <div class="user-profile-cell">
                  <div class="avatar-cell">
                    {{ getInitials(member.full_name) }}
                  </div>
                  <div>
                    <div class="user-name">{{ member.full_name }}</div>
                    <div class="user-phone">{{ member.phone_number || "Tidak ada telepon" }}</div>
                  </div>
                </div>
              </td>
              <td>{{ member.email }}</td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(member.role)">
                  {{ formatRole(member.role) }}
                </span>
              </td>
              <td>
                <span class="active-task-pill" :class="{ 'has-load': member.active_tasks_count > 0 }">
                  {{ member.active_tasks_count }} Tugas
                </span>
              </td>
              <td>{{ formatDate(member.joined_at) }}</td>
              <td>
                <button
                  v-if="member.role !== 'HEAD_OF_DEPARTMENT' && member.id !== currentUser?.id"
                  class="btn btn-danger btn-sm"
                  @click="confirmRemoveMember(member)"
                  :disabled="removingId === member.id"
                >
                  {{ removingId === member.id ? "Memproses..." : "Keluarkan" }}
                </button>
                <span v-else class="protected-pill">Kepala / Anda</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Add Member to Department -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Tambahkan Anggota ke Departemen</h3>
            <p class="modal-subtitle">Pilih pengguna yang akan didaftarkan sebagai anggota departemen ini</p>
          </div>
          <button class="close-btn" @click="showAddModal = false">&times;</button>
        </div>

        <form @submit.prevent="handleAddMember" class="modal-body">
          <!-- If available users list is loaded (e.g. for Admin) -->
          <!-- If available users list is loaded -->
          <div class="form-group" v-if="availableUsers.length > 0">
            <label class="form-label" for="select-user">Pilih Pengguna Terdaftar <span class="required">*</span></label>
            <select id="select-user" v-model="selectedUserId" class="form-control" required>
              <option value="">-- Pilih dari akun terdaftar --</option>
              <option 
                v-for="u in availableUsers" 
                :key="u.id" 
                :value="u.id"
                :disabled="isAlreadyMember(u.id)"
              >
                {{ u.full_name }} ({{ u.email }}) {{ isAlreadyMember(u.id) ? ' - [Sudah Terdaftar]' : '' }}
              </option>
            </select>
          </div>

          <!-- Fallback direct input User ID if list is empty -->
          <div class="form-group" v-else>
            <label class="form-label" for="manual-user-id">Masukkan ID Pengguna (UUID) <span class="required">*</span></label>
            <input
              id="manual-user-id"
              v-model="selectedUserId"
              type="text"
              class="form-control"
              placeholder="Contoh: 123e4567-e89b-12d3-a456-426614174000"
              required
            />
            <small class="form-hint">Dapat diperoleh dari daftar pengguna pada menu Administrator.</small>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submittingAdd || !selectedUserId">
              {{ submittingAdd ? "Menambahkan..." : "Tambahkan ke Tim" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useToastStore } from "../../stores/toast.js";
import { teamApi, userApi } from "../../api/common-api.js";

const authStore = useAuthStore();
const toastStore = useToastStore();

const currentUser = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);

const members = ref([]);
const availableUsers = ref([]);
const loading = ref(false);
const showAddModal = ref(false);
const selectedUserId = ref("");
const submittingAdd = ref(false);
const removingId = ref(null);

const totalActiveTasksInTeam = computed(() => {
  return members.value.reduce((acc, cur) => acc + (cur.active_tasks_count || 0), 0);
});

const isAlreadyMember = (userId) => {
  return members.value.some((m) => m.id === userId);
};

const loadMembers = async () => {
  loading.value = true;
  try {
    const res = await teamApi.listMembers();
    members.value = res.data || [];
  } catch (err) {
    toastStore.error("Gagal memuat anggota tim");
  } finally {
    loading.value = false;
  }
};

const loadAvailableUsers = async () => {
  try {
    const res = await userApi.listUsers();
    availableUsers.value = res.data || [];
  } catch (err) {
    console.error("Gagal load available users:", err);
  }
};

const handleAddMember = async () => {
  if (!selectedUserId.value) return;
  submittingAdd.value = true;
  try {
    await teamApi.addMember(selectedUserId.value);
    toastStore.success("Anggota berhasil ditambahkan ke departemen!");
    selectedUserId.value = "";
    showAddModal.value = false;
    await loadMembers();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal menambahkan anggota");
  } finally {
    submittingAdd.value = false;
  }
};

const confirmRemoveMember = async (member) => {
  const confirmed = confirm(
    `Apakah Anda yakin ingin mengeluarkan ${member.full_name} (${member.email}) dari tim departemen?`
  );
  if (!confirmed) return;

  removingId.value = member.id;
  try {
    await teamApi.removeMember(member.id);
    toastStore.success("Anggota berhasil dikeluarkan dari tim departemen.");
    await loadMembers();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengeluarkan anggota tim");
  } finally {
    removingId.value = null;
  }
};

onMounted(async () => {
  await loadMembers();
  await loadAvailableUsers();
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
.team-page {
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
}

.stat-num {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
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

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
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

.user-profile-cell {
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

.user-name {
  font-weight: 600;
  color: var(--text-main);
}

.user-phone {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.active-task-pill {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.active-task-pill.has-load {
  color: var(--color-primary);
  font-weight: 700;
}

.protected-pill {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-muted);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
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

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
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
</style>
