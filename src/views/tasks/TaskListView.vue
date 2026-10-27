<template>
  <div class="tasks-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Tugas Departemen</h1>
        <p class="page-subtitle">Kelola, delegasikan, dan pantau seluruh siklus pengerjaan tugas tim</p>
      </div>

      <div class="header-actions">
        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'kanban' }"
            @click="viewMode = 'kanban'"
            title="Tampilan Papan Kanban"
          >
            📊 Kanban
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'table' }"
            @click="viewMode = 'table'"
            title="Tampilan Tabel Rinci"
          >
            📋 Tabel
          </button>
        </div>

        <button class="btn btn-primary" @click="showCreateModal = true">
          + {{ isKadep || isAdmin ? "Buat Tugas" : "Usulkan Tugas" }}
        </button>
      </div>
    </div>

    <!-- In-App Alert Banner (100% Terlihat) -->
    <div v-if="alertState.message" class="alert-banner" :class="`alert-${alertState.type}`">
      <div class="alert-content">
        <span class="alert-icon">{{ alertState.type === 'success' ? '✅' : '⚠️' }}</span>
        <span>{{ alertState.message }}</span>
      </div>
      <button class="alert-close" @click="alertState.message = ''">&times;</button>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="card toolbar-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          @input="handleSearchInput" 
          type="text" 
          placeholder="Cari berdasarkan judul atau deskripsi..." 
          class="form-control search-input"
        />
        <button v-if="filters.search" class="clear-search-btn" @click="clearSearch">&times;</button>
      </div>

      <div class="filter-controls">
        <select v-model="filters.priority" @change="applyFilters" class="form-control select-filter">
          <option value="">Semua Prioritas</option>
          <option value="URGENT">Mendesak (Urgent)</option>
          <option value="HIGH">Tinggi (High)</option>
          <option value="MEDIUM">Sedang (Medium)</option>
          <option value="LOW">Rendah (Low)</option>
        </select>

        <select v-model="filters.status" @change="applyFilters" class="form-control select-filter">
          <option value="">Semua Status</option>
          <option value="PENDING_CREATION_APPROVAL">Usulan (Menunggu Kadep)</option>
          <option value="TODO">Siap Dikerjakan (TODO)</option>
          <option value="IN_PROGRESS">Sedang Dikerjakan</option>
          <option value="PENDING_COMPLETION_APPROVAL">Verifikasi Selesai</option>
          <option value="DONE">Selesai (Done)</option>
          <option value="REJECTED">Ditolak (Rejected)</option>
        </select>

        <button class="btn btn-secondary btn-sm" @click="resetFilters" title="Reset Semua Filter">
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="taskStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat daftar tugas...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="taskStore.tasks.length === 0" class="empty-state card">
      <div class="empty-icon">📂</div>
      <h3>Tidak Ada Tugas Ditemukan</h3>
      <p>Belum ada tugas yang cocok dengan filter pencarian saat ini atau belum ada tugas yang dibuat.</p>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        + Buat Tugas Sekarang
      </button>
    </div>

    <!-- 1. KANBAN BOARD VIEW -->
    <div v-else-if="viewMode === 'kanban'" class="kanban-board">
      <div 
        v-for="col in kanbanColumns" 
        :key="col.status" 
        class="kanban-column"
        :class="col.colorClass"
      >
        <div class="column-header">
          <div class="column-title-box">
            <span class="column-dot"></span>
            <h3 class="column-title">{{ col.title }}</h3>
          </div>
          <span class="column-counter">{{ getTasksByStatus(col.status).length }}</span>
        </div>

        <div class="column-cards">
          <TaskCard
            v-for="task in getTasksByStatus(col.status)"
            :key="task.id"
            :task="task"
            @select="handleSelectTask"
            @delete="confirmDeleteTask"
          />
          <div v-if="getTasksByStatus(col.status).length === 0" class="empty-column-box">
            Kosong
          </div>
        </div>
      </div>
    </div>

    <!-- 2. TABLE VIEW -->
    <div v-else class="card table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 120px;">ID Tugas</th>
              <th>Judul Tugas</th>
              <th>Prioritas</th>
              <th>Status Alur</th>
              <th>Pelaksana</th>
              <th>Subtugas</th>
              <th>Batas Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="task in taskStore.tasks" 
              :key="task.id"
              class="table-row-clickable"
              @click="handleSelectTask(task)"
            >
              <td>
                <span class="task-id-badge">{{ task.id }}</span>
              </td>
              <td class="col-title">
                <div class="table-title-row">
                  <span v-if="task.department" class="dept-badge">{{ task.department.name }}</span>
                  <span class="table-task-title">{{ task.title }}</span>
                </div>
                <div class="table-task-desc" v-if="task.description">
                  {{ truncate(task.description, 60) }}
                </div>
              </td>
              <td>
                <span class="badge" :class="getPriorityClass(task.priority)">
                  {{ formatPriority(task.priority) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(task.status)">
                  {{ formatStatus(task.status) }}
                </span>
              </td>
              <td>
                <div class="table-assignee" v-if="task.assignee">
                  <div class="avatar-mini">{{ getInitials(task.assignee.full_name || task.assignee.name) }}</div>
                  <span>{{ task.assignee.full_name || task.assignee.name }}</span>
                </div>
                <span v-else class="unassigned-muted">Belum ada</span>
                <div v-if="task.reporter" class="table-reporter-meta" :title="`Reporter: ${task.reporter.full_name || task.reporter.name}`">
                  <span class="reporter-label">Rep:</span> {{ task.reporter.full_name || task.reporter.name }}
                </div>
              </td>
              <td>
                <div class="table-progress">
                  <div class="progress-bar-mini">
                    <div 
                      class="progress-bar-mini-fill" 
                      :style="{ width: `${getTaskProgress(task)}%` }"
                    ></div>
                  </div>
                  <span class="progress-txt">{{ getTaskProgress(task) }}%</span>
                </div>
              </td>
              <td>
                <span :class="{ 'text-danger font-bold': isOverdue(task.due_date, task.status) }">
                  {{ formatDate(task.due_date) }}
                </span>
              </td>
              <td>
                <div class="table-actions-cell">
                  <button class="btn btn-secondary btn-sm" @click.stop="handleSelectTask(task)">
                    Detail
                  </button>
                  <button 
                    v-if="canDeleteTask(task)"
                    class="btn btn-danger-outline btn-sm" 
                    @click.stop="confirmDeleteTask(task)" 
                    title="Hapus Tugas Ini"
                  >
                    🗑 Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Task Modal -->
    <TaskFormModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @saved="handleTaskCreated"
    />

    <!-- Task Detail Modal -->
    <TaskDetailModal
      v-if="selectedTaskId"
      :task-id="selectedTaskId"
      @close="selectedTaskId = null"
      @updated="refreshTasks"
      @deleted="handleTaskDeletedFromDetail"
    />

    <!-- In-App Delete Confirmation Modal (100% Terlihat & Elegan) -->
    <Teleport to="body">
      <div 
        v-if="taskToDelete" 
        class="modal-overlay delete-confirm-overlay" 
        @click.self="taskToDelete = null"
      >
        <div class="modal-content delete-confirm-box">
          <div class="delete-header">
            <div class="delete-icon">🗑️</div>
            <div>
              <h3 class="delete-title">Konfirmasi Hapus Tugas</h3>
              <p class="delete-subtitle">Tindakan ini permanen dan tidak dapat dibatalkan</p>
            </div>
          </div>

          <div class="delete-body">
            <p class="delete-message">
              Apakah Anda yakin ingin menghapus tugas ini secara permanen dari sistem?
            </p>
            <div class="task-target-card">
              <span class="task-id-badge">{{ taskToDelete.id }}</span>
              <span class="task-target-title">{{ taskToDelete.title }}</span>
            </div>
            <div class="delete-warning-note">
              ⚠️ Seluruh subtugas, berkas lampiran, dan riwayat persetujuan tugas ini akan ikut dihapus permanen.
            </div>
          </div>

          <div class="delete-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="taskToDelete = null" 
              :disabled="isDeleting"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="executeDeleteFromList" 
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="spinner-sm"></span>
              {{ isDeleting ? "Menghapus..." : "Ya, Hapus Sekarang" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useTaskStore } from "../../stores/task.js";
import { useToastStore } from "../../stores/toast.js";
import TaskCard from "../../components/task/TaskCard.vue";
import TaskFormModal from "../../components/task/TaskFormModal.vue";
import TaskDetailModal from "../../components/task/TaskDetailModal.vue";

const authStore = useAuthStore();
const taskStore = useTaskStore();
const toastStore = useToastStore();

const isKadep = computed(() => authStore.isKadep);
const isAdmin = computed(() => authStore.isAdmin);

const taskToDelete = ref(null);
const isDeleting = ref(false);
const alertState = reactive({ message: "", type: "success" });

const viewMode = ref("kanban");
const showCreateModal = ref(false);
const selectedTaskId = ref(null);

const filters = reactive({
  search: "",
  priority: "",
  status: "",
});

let searchTimeout = null;

const kanbanColumns = [
  { status: "PENDING_CREATION_APPROVAL", title: "Usulan", colorClass: "col-warning" },
  { status: "TODO", title: "Siap Dikerjakan", colorClass: "col-todo" },
  { status: "IN_PROGRESS", title: "Sedang Dikerjakan", colorClass: "col-progress" },
  { status: "PENDING_COMPLETION_APPROVAL", title: "Verifikasi", colorClass: "col-review" },
  { status: "DONE", title: "Selesai", colorClass: "col-done" },
  { status: "REJECTED", title: "Ditolak", colorClass: "col-danger" },
];

const getTasksByStatus = (status) => {
  return taskStore.tasks.filter((t) => t.status === status);
};

const refreshTasks = async () => {
  await taskStore.fetchTasks();
};

const handleTaskCreated = async () => {
  showCreateModal.value = false;
  await refreshTasks();
};

const handleSelectTask = (task) => {
  selectedTaskId.value = task.id;
};

const canDeleteTask = (task) => {
  if (!task) return false;
  return isKadep.value || isAdmin.value || task.created_by_id === authStore.user?.id;
};

const confirmDeleteTask = (task) => {
  taskToDelete.value = task;
};

const handleTaskDeletedFromDetail = async (info) => {
  selectedTaskId.value = null;
  alertState.message = `Tugas [${info.id}] "${info.title}" berhasil dihapus secara permanen.`;
  alertState.type = "success";
  await refreshTasks();
};

const executeDeleteFromList = async () => {
  if (!taskToDelete.value) return;
  const targetId = taskToDelete.value.id;
  const targetTitle = taskToDelete.value.title;
  isDeleting.value = true;
  try {
    await taskStore.deleteTask(targetId);
    alertState.message = `Tugas [${targetId}] "${targetTitle}" berhasil dihapus secara permanen.`;
    alertState.type = "success";
    toastStore.showSuccess(`Tugas [${targetId}] berhasil dihapus.`);
    taskToDelete.value = null;
    await refreshTasks();
  } catch (err) {
    alertState.message = err.response?.data?.message || err.message || "Gagal menghapus tugas.";
    alertState.type = "danger";
    toastStore.showError(alertState.message);
  } finally {
    isDeleting.value = false;
  }
};

const applyFilters = () => {
  taskStore.filters.priority = filters.priority;
  taskStore.filters.status = filters.status;
  taskStore.filters.search = filters.search;
  taskStore.fetchTasks();
};

const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 350);
};

const clearSearch = () => {
  filters.search = "";
  applyFilters();
};

const resetFilters = () => {
  filters.search = "";
  filters.priority = "";
  filters.status = "";
  applyFilters();
};

onMounted(async () => {
  await refreshTasks();
});

// Helpers
const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const truncate = (text, len) => {
  if (!text) return "";
  return text.length > len ? text.substring(0, len) + "..." : text;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === "DONE") return false;
  return new Date(dateStr) < new Date();
};

const formatPriority = (p) => {
  const map = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", URGENT: "Mendesak" };
  return map[p] || p;
};

const getPriorityClass = (p) => {
  const map = { LOW: "badge-todo", MEDIUM: "badge-progress", HIGH: "badge-warning", URGENT: "badge-urgent" };
  return map[p] || "badge-todo";
};

const formatStatus = (s) => {
  const map = {
    PENDING_CREATION_APPROVAL: "Usulan",
    TODO: "Siap (TODO)",
    IN_PROGRESS: "Dikerjakan",
    PENDING_COMPLETION_APPROVAL: "Verifikasi",
    DONE: "Selesai",
    REJECTED: "Ditolak",
  };
  return map[s] || s;
};

const getStatusBadgeClass = (s) => {
  const map = {
    PENDING_CREATION_APPROVAL: "badge-pending",
    TODO: "badge-todo",
    IN_PROGRESS: "badge-progress",
    PENDING_COMPLETION_APPROVAL: "badge-review",
    DONE: "badge-done",
    REJECTED: "badge-urgent",
  };
  return map[s] || "badge-todo";
};

const getTaskProgress = (t) => {
  if (!t) return 0;
  if (t.subtasks && t.subtasks.length > 0) {
    const completed = t.subtasks.filter((s) => s.is_completed).length;
    return Math.round((completed / t.subtasks.length) * 100);
  }
  return t.progress_percentage ?? t.progress_percent ?? (t.status === "DONE" ? 100 : 0);
};
</script>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  max-width: 1560px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-toggle {
  display: flex;
  background: var(--bg-muted);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 0.4rem 0.8rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.toolbar-card {
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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
  left: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.search-input {
  padding-left: 2.25rem;
  padding-right: 2rem;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-filter {
  width: auto;
  min-width: 170px;
}

.loading-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
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

.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 2.75rem;
}

/* Kanban Board Styling */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1.5rem;
  min-height: 600px;
}

@media (max-width: 1400px) {
  .kanban-board {
    grid-template-columns: repeat(3, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}

.kanban-column {
  background: #f1f5f9;
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 3px solid #cbd5e1;
}

.col-warning { border-top-color: #f59e0b; }
.col-todo { border-top-color: #64748b; }
.col-progress { border-top-color: #3b82f6; }
.col-review { border-top-color: #ea580c; }
.col-done { border-top-color: #10b981; }
.col-danger { border-top-color: #ef4444; }

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
}

.column-title-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.column-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.column-counter {
  background: white;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

.empty-column-box {
  text-align: center;
  padding: 2rem 0;
  color: #94a3b8;
  font-size: 0.8125rem;
  border: 1px dashed #cbd5e1;
  border-radius: var(--radius-md);
}

/* Table View Styling */
.table-card {
  padding: 0;
  overflow: hidden;
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
  padding: 0.85rem 1rem;
  font-weight: 700;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-row-clickable {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.table-row-clickable:hover {
  background: #f8fafc;
}

.table-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dept-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.table-task-title {
  font-weight: 600;
  color: var(--text-main);
}

.table-task-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.table-assignee {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
}

.table-reporter-meta {
  font-size: 0.71875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.reporter-label {
  font-weight: 600;
  color: var(--color-primary);
}

.avatar-mini {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unassigned-muted {
  color: #94a3b8;
  font-size: 0.75rem;
  font-style: italic;
}

.table-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-mini {
  width: 60px;
  height: 6px;
  background-color: var(--border-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-mini-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
}

.progress-txt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
}

.font-bold {
  font-weight: 700;
}
</style>
