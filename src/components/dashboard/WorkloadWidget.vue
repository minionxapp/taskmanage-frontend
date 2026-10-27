<template>
  <div class="card workload-widget">
    <div class="widget-header">
      <div>
        <h3 class="widget-title">Distribusi Beban Kerja Tim</h3>
        <p class="widget-subtitle">Pantau alokasi tugas aktif dan penyelesaian setiap anggota</p>
      </div>
      <div class="team-badge" v-if="workload.length">
        {{ workload.length }} Anggota
      </div>
    </div>

    <div v-if="!workload.length" class="empty-state">
      <div class="empty-icon">👥</div>
      <p>Belum ada data beban kerja anggota departemen</p>
    </div>

    <div v-else class="workload-list">
      <div v-for="item in workload" :key="item.user_id" class="workload-item">
        <div class="member-info">
          <div class="avatar-circle">
            {{ getInitials(item.name) }}
          </div>
          <div class="member-meta">
            <div class="member-name">{{ item.name }}</div>
            <div class="member-role">{{ formatRole(item.role) }}</div>
          </div>
        </div>

        <div class="task-stats">
          <div class="stat-counts">
            <span class="active-count" :class="getLoadClass(item.active_tasks_count)">
              <strong>{{ item.active_tasks_count }}</strong> Aktif
            </span>
            <span class="divider">•</span>
            <span class="completed-count">
              <strong>{{ item.completed_tasks_count }}</strong> Selesai
            </span>
          </div>

          <!-- Visual Bar -->
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ width: getPercentage(item.active_tasks_count) + '%' }"
              :class="getBarColorClass(item.active_tasks_count)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  workload: {
    type: Array,
    default: () => [],
  },
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

const formatRole = (role) => {
  if (role === "HEAD_OF_DEPARTMENT") return "Kepala Departemen";
  if (role === "ADMIN") return "Administrator";
  return "Anggota Tim";
};

const getPercentage = (activeCount) => {
  const max = 10;
  return Math.min(100, Math.round((activeCount / max) * 100));
};

const getLoadClass = (count) => {
  if (count > 5) return "load-heavy";
  if (count >= 3) return "load-moderate";
  return "load-light";
};

const getBarColorClass = (count) => {
  if (count > 5) return "bar-danger";
  if (count >= 3) return "bar-warning";
  return "bar-primary";
};
</script>

<style scoped>
.workload-widget {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.widget-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.widget-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.team-badge {
  background: var(--bg-muted);
  color: var(--text-muted);
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
}

.workload-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.workload-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.member-meta {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
}

.member-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 140px;
}

.stat-counts {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.divider {
  color: #cbd5e1;
}

.load-heavy {
  color: var(--color-danger);
}
.load-moderate {
  color: var(--color-warning);
}
.load-light {
  color: var(--color-primary);
}

.bar-container {
  width: 100%;
  height: 6px;
  background-color: var(--border-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.bar-primary {
  background: linear-gradient(90deg, #4f46e5, #6366f1);
}
.bar-warning {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.bar-danger {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
</style>
