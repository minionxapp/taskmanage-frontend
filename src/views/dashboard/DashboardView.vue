<template>
  <div class="dashboard-page">
    <!-- Header Section -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard Departemen</h1>
        <p class="page-subtitle">
          Selamat datang kembali, <strong>{{ currentUser?.full_name || currentUser?.name || 'Pengguna' }}</strong>! 
          Berikut adalah ikhtisar performa tugas dan antrean persetujuan departemen.
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="refreshData">
          🔄 Muat Ulang
        </button>
        <button class="btn btn-primary" @click="showCreateModal = true">
          + {{ isKadep || isAdmin ? "Buat Tugas Baru" : "Usulkan Tugas Baru" }}
        </button>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <KpiCard
        title="Tugas Aktif"
        :value="dashboardStore.metrics.total_active"
        icon="📋"
        color="primary"
        trend="Total siklus aktif"
      />
      <KpiCard
        title="Antrean Persetujuan"
        :value="(dashboardStore.metrics.pending_creation || 0) + (dashboardStore.metrics.pending_completion || 0)"
        icon="🛡️"
        color="warning"
        :trend="`Usulan: ${dashboardStore.metrics.pending_creation || 0} | Verifikasi: ${dashboardStore.metrics.pending_completion || 0}`"
      />
      <KpiCard
        title="Sedang Dikerjakan"
        :value="dashboardStore.metrics.in_progress"
        icon="⚡"
        color="primary"
        trend="Dalam tahap eksekusi tim"
      />
      <KpiCard
        title="Tugas Selesai"
        :value="dashboardStore.metrics.completed"
        icon="✅"
        color="success"
        trend="Terverifikasi Kepala Departemen"
      />
    </div>

    <!-- Kadep / Admin Two-Gate Approval Queue Widget -->
    <div v-if="isKadep || isAdmin" class="section-container">
      <ApprovalQueueWidget
        :queue="dashboardStore.queue"
        @approved="refreshData"
        @rejected="refreshData"
        @requested-revision="refreshData"
        @select-task="handleSelectTask"
        @view-task="handleSelectTask"
      />
    </div>

    <!-- Team Workload & Department Quick Info Grid -->
    <div class="dashboard-two-column">
      <div class="column-main">
        <WorkloadWidget :workload="dashboardStore.workload" />
      </div>

      <div class="column-side">
        <!-- Quick Actions & Department Info Card -->
        <div class="card summary-card">
          <h3 class="card-heading">Informasi Departemen</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Departemen:</span>
              <span class="info-val">{{ currentUser?.department?.name || "Divisi Operasional" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Peran Anda:</span>
              <span class="badge" :class="getRoleBadgeClass(currentUser?.role)">
                {{ formatRole(currentUser?.role) }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Tugas Terlambat:</span>
              <span class="info-val overdue-alert" :class="{ 'has-overdue': dashboardStore.metrics.overdue > 0 }">
                {{ dashboardStore.metrics.overdue }} Tugas
              </span>
            </div>
          </div>

          <div class="action-links">
            <router-link to="/tasks" class="btn btn-secondary btn-block">
              📂 Buka Semua Tugas (Kanban / Tabel)
            </router-link>
            <router-link v-if="isKadep || isAdmin" to="/team" class="btn btn-secondary btn-block">
              👥 Kelola Anggota Tim
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Form Modal -->
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
      @updated="refreshData"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useDashboardStore } from "../../stores/dashboard.js";
import KpiCard from "../../components/dashboard/KpiCard.vue";
import ApprovalQueueWidget from "../../components/dashboard/ApprovalQueueWidget.vue";
import WorkloadWidget from "../../components/dashboard/WorkloadWidget.vue";
import TaskFormModal from "../../components/task/TaskFormModal.vue";
import TaskDetailModal from "../../components/task/TaskDetailModal.vue";

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const currentUser = computed(() => authStore.user);
const isKadep = computed(() => authStore.isKadep);
const isAdmin = computed(() => authStore.isAdmin);

const showCreateModal = ref(false);
const selectedTaskId = ref(null);

const refreshData = async () => {
  await dashboardStore.fetchDashboardData(isKadep.value, isAdmin.value);
};

const handleTaskCreated = async () => {
  showCreateModal.value = false;
  await refreshData();
};

const handleSelectTask = (taskOrId) => {
  selectedTaskId.value = typeof taskOrId === "object" ? taskOrId.id : taskOrId;
};

onMounted(async () => {
  await refreshData();
});

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
.dashboard-page {
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

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.section-container {
  width: 100%;
}

.dashboard-two-column {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 992px) {
  .dashboard-two-column {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-heading {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed var(--border-color);
}

.info-label {
  color: var(--text-muted);
}

.info-val {
  font-weight: 600;
  color: var(--text-main);
}

.overdue-alert.has-overdue {
  color: var(--color-danger);
  font-weight: 700;
}

.action-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-block {
  width: 100%;
  text-align: center;
}
</style>
