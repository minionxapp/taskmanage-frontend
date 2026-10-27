<template>
  <div class="audit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Jejak Audit Sistem (Audit Trail)</h1>
        <p class="page-subtitle">
          Rekaman seluruh aktivitas keamanan, perubahan status tugas, dan persetujuan Kepala Departemen
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadLogs">
          🔄 Refresh Log
        </button>
      </div>
    </div>

    <!-- Filter & Limit -->
    <div class="card toolbar-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Saring berdasarkan aksi, email, atau resource..." 
          class="form-control"
        />
      </div>

      <div class="limit-box">
        <span class="limit-label">Menampilkan maksimal:</span>
        <select v-model="logLimit" @change="loadLogs" class="form-control limit-select">
          <option :value="50">50 Terakhir</option>
          <option :value="100">100 Terakhir</option>
          <option :value="200">200 Terakhir</option>
        </select>
      </div>
    </div>

    <!-- Logs Table Card -->
    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat rekaman log audit...</p>
      </div>

      <div v-else-if="filteredLogs.length === 0" class="empty-state">
        <div class="empty-icon">🛡️</div>
        <p>Belum ada jejak aktivitas audit yang cocok.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Waktu (WIB)</th>
              <th>Aksi Audit</th>
              <th>Pengguna</th>
              <th>Tipe Sumber Daya</th>
              <th>Alamat IP</th>
              <th>Rincian Data</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id">
              <td class="time-col">
                <span class="timestamp-text">{{ formatDateTime(log.created_at) }}</span>
              </td>
              <td>
                <span class="badge" :class="getActionBadgeClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td>
                <div class="user-meta" v-if="log.user">
                  <span class="user-name">{{ log.user.full_name || log.user.name }}</span>
                  <span class="user-email">{{ log.user.email }}</span>
                </div>
                <span v-else class="system-tag">Sistem</span>
              </td>
              <td>
                <span class="resource-pill">{{ log.resource_type || "-" }}</span>
              </td>
              <td>
                <span class="ip-code">{{ log.ip_address || "127.0.0.1" }}</span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="viewDetails(log)">
                  Lihat JSON
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: JSON Details -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Rincian Data Log: {{ selectedLog?.action }}</h3>
          <button class="close-btn" @click="showDetailModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div><strong>Log ID:</strong> <code>{{ selectedLog?.id }}</code></div>
            <div><strong>Waktu:</strong> {{ formatDateTime(selectedLog?.created_at) }}</div>
            <div><strong>Pengguna:</strong> {{ selectedLog?.user?.email || "Sistem" }}</div>
            <div><strong>Resource ID:</strong> <code>{{ selectedLog?.resource_id || "-" }}</code></div>
          </div>
          <div class="json-container">
            <pre>{{ formatJson(selectedLog?.details) }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" @click="showDetailModal = false">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToastStore } from "../../stores/toast.js";
import { dashboardApi } from "../../api/common-api.js";

const toastStore = useToastStore();

const logs = ref([]);
const loading = ref(false);
const searchTerm = ref("");
const logLimit = ref(100);

const selectedLog = ref(null);
const showDetailModal = ref(false);

const filteredLogs = computed(() => {
  if (!searchTerm.value.trim()) return logs.value;
  const term = searchTerm.value.toLowerCase();
  return logs.value.filter((l) => {
    return (
      l.action?.toLowerCase().includes(term) ||
      l.user?.email?.toLowerCase().includes(term) ||
      l.user?.full_name?.toLowerCase().includes(term) ||
      l.resource_type?.toLowerCase().includes(term) ||
      l.ip_address?.toLowerCase().includes(term)
    );
  });
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await dashboardApi.listAuditLogs(logLimit.value);
    logs.value = res.data || [];
  } catch (err) {
    toastStore.error("Gagal memuat log audit");
  } finally {
    loading.value = false;
  }
};

const viewDetails = (log) => {
  selectedLog.value = log;
  showDetailModal.value = true;
};

const formatJson = (data) => {
  if (!data) return "{}";
  if (typeof data === "string") {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
};

onMounted(async () => {
  await loadLogs();
});

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
};

const getActionBadgeClass = (action) => {
  if (!action) return "badge-todo";
  if (action.includes("APPROVED")) return "badge-done";
  if (action.includes("REJECTED") || action.includes("DELETED")) return "badge-urgent";
  if (action.includes("REVISION") || action.includes("WARNING")) return "badge-review";
  if (action.includes("LOGIN") || action.includes("LOGOUT")) return "badge-progress";
  return "badge-todo";
};
</script>

<style scoped>
.audit-page {
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

.toolbar-card {
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 280px;
}

.limit-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.limit-select {
  width: auto;
}

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

.time-col {
  white-space: nowrap;
}

.timestamp-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.8125rem;
}

.user-email {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.system-tag {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.resource-pill {
  font-size: 0.75rem;
  background: var(--bg-muted);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  color: #475569;
}

.ip-code {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.1rem;
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.json-container {
  background: #0f172a;
  color: #38bdf8;
  padding: 1rem;
  border-radius: var(--radius-md);
  max-height: 300px;
  overflow: auto;
  font-family: monospace;
  font-size: 0.8rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
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
</style>
