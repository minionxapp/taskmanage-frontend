<template>
  <div class="card approval-widget" id="approval-queue-widget">
    <div class="widget-header">
      <div class="title-area">
        <div class="badge-count">{{ totalPendingCount }}</div>
        <div>
          <h3 class="widget-title">Antrean Persetujuan Kepala Departemen</h3>
          <p class="widget-subtitle">Tinjau dan sahkan usulan tugas baru serta verifikasi tugas selesai</p>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="queue-tabs">
        <button
          class="queue-tab-btn"
          :class="{ active: activeTab === 'creation' }"
          @click="activeTab = 'creation'"
        >
          Usulan Baru
          <span class="tab-badge">{{ queue.pending_creation?.length || 0 }}</span>
        </button>
        <button
          class="queue-tab-btn"
          :class="{ active: activeTab === 'completion' }"
          @click="activeTab = 'completion'"
        >
          Verifikasi Selesai
          <span class="tab-badge">{{ queue.pending_completion?.length || 0 }}</span>
        </button>
      </div>
    </div>

    <!-- Tab 1: Usulan Baru (Creation Approvals) -->
    <div v-if="activeTab === 'creation'" class="queue-list">
      <div v-if="!queue.pending_creation || queue.pending_creation.length === 0" class="empty-state">
        <p>Tidak ada usulan tugas baru yang menunggu persetujuan.</p>
      </div>

      <div
        v-for="task in queue.pending_creation"
        :key="task.id"
        class="queue-item"
      >
        <div class="item-main">
          <div class="item-header">
            <span class="task-id-badge">{{ task.id }}</span>
            <span class="badge" :class="`badge-priority-${task.priority.toLowerCase()}`">
              {{ task.priority }}
            </span>
            <span class="creator-name">Diusulkan oleh: <strong>{{ task.creator?.full_name }}</strong></span>
          </div>
          <h4 class="item-title" @click="$emit('view-task', task.id)">{{ task.title }}</h4>
          <p v-if="task.description" class="item-desc">{{ task.description }}</p>
        </div>

        <div class="item-actions">
          <button class="btn btn-secondary btn-sm" @click="$emit('view-task', task.id)">
            Rincian
          </button>
          <button class="btn btn-danger btn-sm" @click="openActionModal(task, 'GATE1_REJECT')">
            Tolak
          </button>
          <button class="btn btn-success btn-sm" @click="openActionModal(task, 'GATE1_APPROVE')">
            Setujui
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 2: Verifikasi Selesai (Completion Approvals) -->
    <div v-else class="queue-list">
      <div v-if="!queue.pending_completion || queue.pending_completion.length === 0" class="empty-state">
        <p>Tidak ada pengajuan tugas selesai yang menunggu verifikasi.</p>
      </div>

      <div
        v-for="task in queue.pending_completion"
        :key="task.id"
        class="queue-item"
      >
        <div class="item-main">
          <div class="item-header">
            <span class="task-id-badge">{{ task.id }}</span>
            <span class="badge badge-review">Menunggu Verifikasi</span>
            <span class="creator-name">Pelaksana: <strong>{{ task.assignee?.full_name || 'Tim' }}</strong></span>
            <span v-if="task.reporter" class="reporter-name">Reporter: {{ task.reporter.full_name }}</span>
          </div>
          <h4 class="item-title" @click="$emit('view-task', task.id)">{{ task.title }}</h4>
          <div class="item-meta">
            <span>Sub-tugas: {{ task.subtasks?.length || 0 }} selesai</span>
            <span>Berkas bukti: {{ task.attachments?.length || 0 }} file</span>
            <span>Tautan: {{ task.links?.length || 0 }} link</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn btn-secondary btn-sm" @click="$emit('view-task', task.id)">
            Periksa Bukti
          </button>
          <button class="btn btn-warning btn-sm" @click="openActionModal(task, 'GATE2_REVISION')">
            Revisi
          </button>
          <button class="btn btn-success btn-sm" @click="openActionModal(task, 'GATE2_APPROVE')">
            Setujui
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi / Catatan Keputusan -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay delete-confirm-overlay" @click.self="showModal = false">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button class="close-btn" @click="showModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1rem; font-size: 0.9rem;">
              Tugas: <strong>{{ selectedTask?.title }}</strong>
            </p>

            <div class="form-group">
              <label class="form-label">{{ notesLabel }}</label>
              <textarea
                v-model="decisionNotes"
                class="form-control"
                rows="3"
                :placeholder="notesPlaceholder"
                :required="isNotesRequired"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showModal = false">Batal</button>
              <button
                class="btn"
                :class="modalBtnClass"
                :disabled="loading || (isNotesRequired && !decisionNotes.trim())"
                @click="submitDecision"
              >
                {{ loading ? "Memproses..." : modalBtnText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useTaskStore } from "../../stores/task.js";
import { useToastStore } from "../../stores/toast.js";

const props = defineProps({
  queue: {
    type: Object,
    default: () => ({ pending_creation: [], pending_completion: [] }),
  },
});

const emit = defineEmits(["refresh", "view-task"]);
const taskStore = useTaskStore();
const toastStore = useToastStore();

const activeTab = ref("creation");
const showModal = ref(false);
const selectedTask = ref(null);
const actionType = ref("");
const decisionNotes = ref("");
const loading = ref(false);

const totalPendingCount = computed(() => {
  const c1 = props.queue?.pending_creation?.length || 0;
  const c2 = props.queue?.pending_completion?.length || 0;
  return c1 + c2;
});

const modalTitle = computed(() => {
  switch (actionType.value) {
    case "GATE1_APPROVE": return "Setujui Usulan Tugas";
    case "GATE1_REJECT": return "Tolak Usulan Tugas";
    case "GATE2_APPROVE": return "Setujui Penyelesaian Tugas";
    case "GATE2_REVISION": return "Revisi Tugas";
    default: return "Keputusan Approval";
  }
});

const notesLabel = computed(() => {
  if (actionType.value === "GATE1_REJECT") return "Alasan Penolakan (Wajib)";
  if (actionType.value === "GATE2_REVISION") return "Catatan Poin Perbaikan / Revisi (Wajib)";
  return "Catatan Tambahan (Opsional)";
});

const notesPlaceholder = computed(() => {
  if (actionType.value === "GATE1_REJECT") return "Tuliskan alasan mengapa tugas ini ditolak...";
  if (actionType.value === "GATE2_REVISION") return "Jelaskan apa yang belum lengkap atau perlu diperbaiki pelaksana...";
  return "Tuliskan catatan apresiasi atau arahan tambahan...";
});

const isNotesRequired = computed(() => {
  return actionType.value === "GATE1_REJECT" || actionType.value === "GATE2_REVISION";
});

const modalBtnText = computed(() => {
  switch (actionType.value) {
    case "GATE1_APPROVE": return "Setujui Tugas";
    case "GATE1_REJECT": return "Tolak Usulan";
    case "GATE2_APPROVE": return "Setujui (DONE)";
    case "GATE2_REVISION": return "Kirim Revisi";
    default: return "Kirim";
  }
});

const modalBtnClass = computed(() => {
  if (actionType.value.includes("APPROVE")) return "btn-success";
  if (actionType.value.includes("REJECT")) return "btn-danger";
  return "btn-warning";
});

const openActionModal = (task, type) => {
  selectedTask.value = task;
  actionType.value = type;
  decisionNotes.value = "";
  showModal.value = true;
};

const submitDecision = async () => {
  if (!selectedTask.value) return;
  loading.value = true;

  try {
    const id = selectedTask.value.id;
    const notes = decisionNotes.value;

    if (actionType.value === "GATE1_APPROVE") {
      await taskStore.approveCreation(id, "APPROVED", notes);
      toastStore.showSuccess("Tugas berhasil disetujui (Status: TODO)!");
    } else if (actionType.value === "GATE1_REJECT") {
      await taskStore.approveCreation(id, "REJECTED", notes);
      toastStore.showWarning("Usulan tugas telah ditolak.");
    } else if (actionType.value === "GATE2_APPROVE") {
      await taskStore.approveCompletion(id, "APPROVED", notes);
      toastStore.showSuccess("Tugas resmi disahkan selesai (Status: DONE)!");
    } else if (actionType.value === "GATE2_REVISION") {
      await taskStore.approveCompletion(id, "REVISION_REQUESTED", notes);
      toastStore.showInfo("Catatan revisi telah dikirim ke pelaksana.");
    }

    showModal.value = false;
    emit("refresh");
  } catch (err) {
    toastStore.showError(err.response?.data?.message || err.message || "Gagal memproses keputusan");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.approval-widget {
  border-left: 4px solid var(--color-warning);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.badge-count {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background-color: #fef3c7;
  color: #b45309;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.widget-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.queue-tabs {
  display: flex;
  gap: 0.5rem;
  background-color: var(--bg-muted);
  padding: 0.25rem;
  border-radius: var(--radius-md);
}

.queue-tab-btn {
  background: none;
  border: none;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.queue-tab-btn.active {
  background: #ffffff;
  color: var(--text-main);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-badge {
  background-color: rgba(0, 0, 0, 0.08);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--bg-muted);
  border-radius: var(--radius-md);
  gap: 1rem;
  flex-wrap: wrap;
}

.item-main {
  flex: 1;
  min-width: 260px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
}

.item-title {
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-main);
}
.item-title:hover {
  color: var(--color-primary);
}

.item-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.item-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-priority-urgent { background-color: #fee2e2; color: #991b1b; }
.badge-priority-high { background-color: #ffedd5; color: #c2410c; }
.badge-priority-medium { background-color: #dbeafe; color: #1e40af; }
.badge-priority-low { background-color: #f1f5f9; color: #475569; }

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}
.modal-title { font-size: 1.1rem; font-weight: 700; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
.modal-body { padding: 1.5rem; }
.modal-footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
