<template>
  <div class="task-card" :class="`priority-border-${task.priority.toLowerCase()}`" @click="$emit('select', task)">
    <!-- Header: ID, Priority & Status -->
    <div class="card-top">
      <div class="card-top-left">
        <span class="task-id-badge">{{ task.id }}</span>
        <span v-if="task.department" class="dept-badge" :title="`Departemen: ${task.department.name}`">
          {{ task.department.name }}
        </span>
        <span class="badge" :class="getPriorityClass(task.priority)">
          {{ formatPriority(task.priority) }}
        </span>
      </div>
      <div class="card-top-right">
        <span class="badge" :class="getStatusBadgeClass(task.status)">
          {{ formatStatus(task.status) }}
        </span>
        <button 
          v-if="canDelete" 
          class="card-delete-btn" 
          @click.stop="$emit('delete', task)" 
          title="Hapus Tugas Ini"
        >
          🗑
        </button>
      </div>
    </div>

    <!-- Title & Description -->
    <h4 class="task-title">{{ task.title }}</h4>
    <p v-if="task.description" class="task-desc">{{ truncate(task.description, 75) }}</p>

    <!-- Subtasks Progress Bar -->
    <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-progress">
      <div class="progress-info">
        <span class="progress-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Sub Task
        </span>
        <span class="progress-val">{{ completedSubtasksCount }} / {{ task.subtasks.length }} ({{ progressPercentage }}%)</span>
      </div>
      <div class="progress-track">
        <div 
          class="progress-fill" 
          :style="{ width: `${progressPercentage}%` }"
          :class="progressPercentage === 100 ? 'fill-complete' : 'fill-active'"
        ></div>
      </div>
    </div>

    <!-- Meta Details: Due date, attachments, links -->
    <div class="card-meta">
      <div class="due-date" :class="{ 'overdue': isOverdue(task.due_date, task.status) }">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>{{ formatDate(task.due_date) }}</span>
      </div>

      <div class="meta-icons">
        <span v-if="task.comments_count > 0" class="meta-tag" title="Komentar">
          💬 {{ task.comments_count }}
        </span>
        <span v-if="task.attachments && task.attachments.length > 0" class="meta-tag" title="File Terlampir">
          📎 {{ task.attachments.length }}
        </span>
        <span v-if="task.links && task.links.length > 0" class="meta-tag" title="Link Terkait">
          🔗 {{ task.links.length }}
        </span>
      </div>
    </div>

    <!-- Footer: Assignee & Reporter -->
    <div class="card-footer">
      <div class="assignee-box" v-if="task.assignee">
        <div class="avatar-small" :title="`Ditugaskan ke: ${task.assignee.full_name || task.assignee.name}`">
          {{ getInitials(task.assignee.full_name || task.assignee.name) }}
        </div>
        <span class="assignee-name">{{ task.assignee.full_name || task.assignee.name }}</span>
      </div>
      <div v-else class="assignee-empty">
        <span class="unassigned-text">Belum ada pelaksana</span>
      </div>

      <div v-if="task.reporter" class="reporter-pill" :title="`Reporter: ${task.reporter.full_name || task.reporter.name}`">
        <span class="reporter-role">Rep:</span> {{ getInitials(task.reporter.full_name || task.reporter.name) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../stores/auth.js";

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

defineEmits(["select", "delete"]);

const authStore = useAuthStore();
const canDelete = computed(() => {
  return authStore.isKadep || authStore.isAdmin || props.task.created_by_id === authStore.user?.id;
});

const completedSubtasksCount = computed(() => {
  if (!props.task.subtasks) return 0;
  return props.task.subtasks.filter((s) => s.is_completed).length;
});

const progressPercentage = computed(() => {
  if (!props.task.subtasks || props.task.subtasks.length === 0) {
    return props.task.progress_percentage ?? props.task.progress_percent ?? (props.task.status === "DONE" ? 100 : 0);
  }
  return Math.round((completedSubtasksCount.value / props.task.subtasks.length) * 100);
});

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const truncate = (text, len) => {
  if (!text) return "";
  return text.length > len ? text.substring(0, len) + "..." : text;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Tanpa batas";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === "DONE") return false;
  return new Date(dateStr) < new Date();
};

const formatPriority = (p) => {
  const map = {
    LOW: "Rendah",
    MEDIUM: "Sedang",
    HIGH: "Tinggi",
    URGENT: "Mendesak",
  };
  return map[p] || p;
};

const getPriorityClass = (p) => {
  const map = {
    LOW: "badge-todo",
    MEDIUM: "badge-progress",
    HIGH: "badge-warning",
    URGENT: "badge-urgent",
  };
  return map[p] || "badge-todo";
};

const formatStatus = (s) => {
  const map = {
    PENDING_CREATION_APPROVAL: "Usulan",
    TODO: "Siap",
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
</script>

<style scoped>
.task-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-left: 4px solid #cbd5e1;
  border-radius: var(--radius-md);
  padding: 1rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}

.priority-border-urgent {
  border-left-color: var(--color-danger) !important;
}
.priority-border-high {
  border-left-color: var(--color-warning) !important;
}
.priority-border-medium {
  border-left-color: #3b82f6 !important;
}
.priority-border-low {
  border-left-color: #94a3b8 !important;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.card-top-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.35;
  margin: 0;
}

.task-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.subtask-progress {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: var(--bg-app);
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.progress-val {
  font-weight: 600;
  color: var(--text-main);
}

.progress-track {
  width: 100%;
  height: 5px;
  background-color: var(--border-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.fill-active {
  background: var(--color-primary);
}
.fill-complete {
  background: var(--color-success);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.due-date {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.due-date.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.meta-icons {
  display: flex;
  gap: 0.5rem;
}

.meta-tag {
  background: var(--bg-muted);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.6rem;
  border-top: 1px dashed var(--border-color);
}

.assignee-box {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assignee-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-main);
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assignee-empty {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

.reporter-pill {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-muted);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
}

.reporter-role {
  color: var(--color-primary);
}
</style>
