<template>
  <div class="departments-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Master Departemen</h1>
        <p class="page-subtitle">
          Kelola data unit kerja departemen, penunjukan Kepala Departemen (Kadep), dan pengawasan kapasitas tim
        </p>
      </div>

      <button class="btn btn-primary" @click="openCreateModal">
        + Tambah Departemen Baru
      </button>
    </div>

    <!-- Overview Stats -->
    <div class="stats-row">
      <div class="card stat-box">
        <span class="stat-num">{{ departments.length }}</span>
        <span class="stat-label">Total Departemen Terdaftar</span>
      </div>
      <div class="card stat-box">
        <span class="stat-num">{{ departmentsWithHeadCount }}</span>
        <span class="stat-label">Departemen Dengan Kepala Aktif</span>
      </div>
      <div class="card stat-box">
        <span class="stat-num">{{ totalMembersCount }}</span>
        <span class="stat-label">Total Anggota Terdistribusi</span>
      </div>
      <div class="card stat-box">
        <span class="stat-num">{{ totalTasksCount }}</span>
        <span class="stat-label">Total Tugas Aktif Terkait</span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="card toolbar-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari nama departemen atau deskripsi..." 
          class="form-control search-input"
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">&times;</button>
      </div>

      <button class="btn btn-secondary btn-sm" @click="loadData" :disabled="loading">
        🔄 Refresh
      </button>
    </div>

    <!-- Table Card -->
    <div class="card table-card">
      <div class="table-card-header">
        <h3 class="card-title">Daftar Departemen Organisasi</h3>
        <span class="table-count-badge">{{ filteredDepartments.length }} unit kerja</span>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat daftar departemen...</p>
      </div>

      <div v-else-if="filteredDepartments.length === 0" class="empty-state">
        <div class="empty-icon">🏢</div>
        <h3>Tidak Ada Departemen Ditemukan</h3>
        <p v-if="searchQuery">Tidak ada departemen yang cocok dengan kata kunci "{{ searchQuery }}".</p>
        <p v-else>Belum ada departemen yang dibuat dalam sistem. Klik tombol Tambah Departemen di atas.</p>
        <button v-if="!searchQuery" class="btn btn-primary btn-sm" @click="openCreateModal">
          + Input Departemen Baru
        </button>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="min-width: 220px;">Nama Departemen</th>
              <th>Deskripsi</th>
              <th>Kepala Departemen</th>
              <th style="text-align: center;">Anggota</th>
              <th style="text-align: center;">Tugas Terkait</th>
              <th>Dibuat Pada</th>
              <th style="text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in filteredDepartments" :key="dept.id">
              <td>
                <div class="dept-title-cell">
                  <div class="dept-icon-box">🏢</div>
                  <div>
                    <span class="dept-name">{{ dept.name }}</span>
                    <span class="dept-id-nano">ID: {{ dept.id.substring(0, 8) }}...</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="dept-desc" v-if="dept.description">{{ dept.description }}</span>
                <span class="text-muted-italic" v-else>Tanpa deskripsi</span>
              </td>
              <td>
                <div v-if="dept.head" class="head-profile-cell">
                  <div class="avatar-mini">{{ getInitials(dept.head.full_name) }}</div>
                  <div>
                    <div class="head-name">{{ dept.head.full_name }}</div>
                    <div class="head-email">{{ dept.head.email }}</div>
                  </div>
                </div>
                <span v-else class="badge badge-secondary">Belum Ditunjuk</span>
              </td>
              <td style="text-align: center;">
                <span class="count-pill">{{ dept._count?.members || 0 }} Orang</span>
              </td>
              <td style="text-align: center;">
                <span class="count-pill" :class="{ 'has-tasks': (dept._count?.tasks || 0) > 0 }">
                  {{ dept._count?.tasks || 0 }} Tugas
                </span>
              </td>
              <td>{{ formatDate(dept.created_at) }}</td>
              <td>
                <div class="actions-cell-right">
                  <button class="btn btn-secondary btn-sm" @click="openEditModal(dept)">
                    ✏️ Edit
                  </button>
                  <button class="btn btn-danger-outline btn-sm" @click="confirmDelete(dept)">
                    🗑️ Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Input / Tambah Departemen Baru -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Input Departemen Baru</h3>
            <p class="modal-subtitle">Daftarkan unit kerja departemen baru ke dalam sistem organisasi</p>
          </div>
          <button class="close-btn" @click="showCreateModal = false">&times;</button>
        </div>

        <form @submit.prevent="handleCreateDepartment" class="modal-body">
          <div class="form-group">
            <label class="form-label" for="dept-name">
              Nama Departemen <span class="required">*</span>
            </label>
            <input 
              id="dept-name" 
              v-model="createForm.name" 
              type="text" 
              class="form-control" 
              placeholder="Contoh: Keuangan & Akuntansi (Finance)"
              required 
              autofocus
            />
            <small class="form-hint">Gunakan nama resmi divisi atau departemen yang jelas dan unik.</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="dept-desc">Deskripsi & Ruang Lingkup</label>
            <textarea 
              id="dept-desc" 
              v-model="createForm.description" 
              rows="3" 
              class="form-control" 
              placeholder="Jelaskan peran pokok dan fungsi kerja departemen ini..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="dept-head">Kepala Departemen (Kadep)</label>
            <select id="dept-head" v-model="createForm.head_id" class="form-control">
              <option value="">-- Belum Ditentukan (Bisa diatur nanti) --</option>
              <option 
                v-for="u in usersList" 
                :key="u.id" 
                :value="u.id"
              >
                {{ u.full_name }} ({{ u.email }}) - [{{ formatRole(u.role) }}]
              </option>
            </select>
            <small class="form-hint">Pengguna yang ditunjuk otomatis akan berwenang memverifikasi alur tugas departemen.</small>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting || !createForm.name.trim()">
              {{ submitting ? "Menyimpan..." : "Simpan Departemen" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Edit Departemen -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Edit Departemen</h3>
            <p class="modal-subtitle">Perbarui data atau kepala departemen untuk: {{ selectedDept?.name }}</p>
          </div>
          <button class="close-btn" @click="showEditModal = false">&times;</button>
        </div>

        <form @submit.prevent="handleUpdateDepartment" class="modal-body">
          <div class="form-group">
            <label class="form-label" for="edit-dept-name">
              Nama Departemen <span class="required">*</span>
            </label>
            <input 
              id="edit-dept-name" 
              v-model="editForm.name" 
              type="text" 
              class="form-control" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-dept-desc">Deskripsi</label>
            <textarea 
              id="edit-dept-desc" 
              v-model="editForm.description" 
              rows="3" 
              class="form-control"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-dept-head">Kepala Departemen (Kadep)</label>
            <select id="edit-dept-head" v-model="editForm.head_id" class="form-control">
              <option value="">-- Tanpa Kepala Departemen --</option>
              <option 
                v-for="u in usersList" 
                :key="u.id" 
                :value="u.id"
              >
                {{ u.full_name }} ({{ u.email }}) - [{{ formatRole(u.role) }}]
              </option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting || !editForm.name.trim()">
              {{ submitting ? "Menyimpan..." : "Perbarui Departemen" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Konfirmasi Hapus Departemen -->
    <div v-if="deptToDelete" class="modal-overlay" @click.self="deptToDelete = null">
      <div class="modal-content delete-modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Konfirmasi Hapus Departemen</h3>
          <button class="close-btn" @click="deptToDelete = null">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Apakah Anda yakin ingin menghapus departemen <strong>{{ deptToDelete.name }}</strong>?
          </p>
          <div v-if="(deptToDelete._count?.tasks || 0) > 0" class="alert-danger-box">
            ⚠️ Departemen ini masih memiliki <strong>{{ deptToDelete._count.tasks }} tugas</strong>. 
            Departemen tidak dapat dihapus sebelum seluruh tugasnya diselesaikan atau dipindahkan.
          </div>
          <div v-else class="alert-warning-box">
            ⚠️ Tindakan ini akan menghapus data departemen dan melepaskan seluruh asosiasi anggota tim di dalamnya.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="deptToDelete = null">Batal</button>
          <button 
            type="button" 
            class="btn btn-danger" 
            @click="handleDeleteDepartment"
            :disabled="submittingDelete || (deptToDelete._count?.tasks || 0) > 0"
          >
            {{ submittingDelete ? "Menghapus..." : "Ya, Hapus Departemen" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { departmentApi, userApi } from "../../api/common-api.js";
import { useToastStore } from "../../stores/toast.js";

const toastStore = useToastStore();

const departments = ref([]);
const usersList = ref([]);
const loading = ref(false);
const searchQuery = ref("");

const showCreateModal = ref(false);
const showEditModal = ref(false);
const submitting = ref(false);
const submittingDelete = ref(false);
const selectedDept = ref(null);
const deptToDelete = ref(null);

const createForm = reactive({
  name: "",
  description: "",
  head_id: "",
});

const editForm = reactive({
  name: "",
  description: "",
  head_id: "",
});

const departmentsWithHeadCount = computed(() => {
  return departments.value.filter((d) => d.head_id).length;
});

const totalMembersCount = computed(() => {
  return departments.value.reduce((acc, cur) => acc + (cur._count?.members || 0), 0);
});

const totalTasksCount = computed(() => {
  return departments.value.reduce((acc, cur) => acc + (cur._count?.tasks || 0), 0);
});

const filteredDepartments = computed(() => {
  if (!searchQuery.value.trim()) return departments.value;
  const q = searchQuery.value.toLowerCase();
  return departments.value.filter((d) => 
    d.name.toLowerCase().includes(q) || 
    (d.description && d.description.toLowerCase().includes(q)) ||
    (d.head && d.head.full_name.toLowerCase().includes(q))
  );
});

const loadData = async () => {
  loading.value = true;
  try {
    const [deptRes, usersRes] = await Promise.all([
      departmentApi.listDepartments(),
      userApi.listUsers(),
    ]);
    departments.value = deptRes.data || [];
    usersList.value = usersRes.data || [];
  } catch (err) {
    toastStore.error("Gagal memuat data departemen atau pengguna");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const openCreateModal = () => {
  createForm.name = "";
  createForm.description = "";
  createForm.head_id = "";
  showCreateModal.value = true;
};

const handleCreateDepartment = async () => {
  if (!createForm.name.trim()) return;
  submitting.value = true;
  try {
    await departmentApi.createDepartment({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      head_id: createForm.head_id || undefined,
    });
    toastStore.success(`Departemen "${createForm.name}" berhasil dibuat!`);
    showCreateModal.value = false;
    await loadData();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal membuat departemen");
  } finally {
    submitting.value = false;
  }
};

const openEditModal = (dept) => {
  selectedDept.value = dept;
  editForm.name = dept.name;
  editForm.description = dept.description || "";
  editForm.head_id = dept.head_id || "";
  showEditModal.value = true;
};

const handleUpdateDepartment = async () => {
  if (!selectedDept.value || !editForm.name.trim()) return;
  submitting.value = true;
  try {
    await departmentApi.updateDepartment(selectedDept.value.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      head_id: editForm.head_id || null,
    });
    toastStore.success(`Departemen "${editForm.name}" berhasil diperbarui!`);
    showEditModal.value = false;
    await loadData();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal memperbarui departemen");
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = (dept) => {
  deptToDelete.value = dept;
};

const handleDeleteDepartment = async () => {
  if (!deptToDelete.value) return;
  submittingDelete.value = true;
  try {
    await departmentApi.deleteDepartment(deptToDelete.value.id);
    toastStore.success(`Departemen "${deptToDelete.value.name}" berhasil dihapus!`);
    deptToDelete.value = null;
    await loadData();
  } catch (err) {
    toastStore.error(err.message || err.response?.data?.errors || err.response?.data?.message || "Gagal menghapus departemen");
  } finally {
    submittingDelete.value = false;
  }
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const formatRole = (role) => {
  switch (role) {
    case "ADMIN": return "Admin";
    case "HEAD_OF_DEPARTMENT": return "Kadep";
    default: return "Anggota";
  }
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>

<style scoped>
.departments-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.15rem 1.25rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.stat-num {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
}

.toolbar-card {
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding-left: 2.35rem;
  padding-right: 2rem;
  width: 100%;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-muted);
  cursor: pointer;
}

.table-card {
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
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
  margin: 0;
}

.table-count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--text-muted);
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
  letter-spacing: 0.04em;
}

.data-table td {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.dept-title-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dept-icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  border: 1px solid #c7d2fe;
}

.dept-name {
  display: block;
  font-weight: 700;
  color: var(--text-main);
  font-size: 0.9375rem;
}

.dept-id-nano {
  display: block;
  font-size: 0.71875rem;
  color: #94a3b8;
  font-family: monospace;
}

.dept-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.4;
  max-width: 320px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-muted-italic {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.8125rem;
}

.head-profile-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-mini {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.head-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.8125rem;
}

.head-email {
  font-size: 0.71875rem;
  color: var(--text-muted);
}

.count-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  background: var(--bg-hover);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.count-pill.has-tasks {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.actions-cell-right {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger-outline:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

/* Modals */
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
  margin-bottom: 0.2rem;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.delete-modal-content {
  max-width: 480px;
}

.alert-danger-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  margin-top: 0.75rem;
}

.alert-warning-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  margin-top: 0.75rem;
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.3rem;
}

.required {
  color: #ef4444;
}
</style>
