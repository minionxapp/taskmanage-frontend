<template>
  <div class="kpi-card card" :class="`kpi-${variant}`">
    <div class="kpi-content">
      <span class="kpi-label">{{ label }}</span>
      <div class="kpi-number">{{ count }}</div>
      <span class="kpi-desc">{{ description }}</span>
    </div>
    <div class="kpi-icon-box">
      <slot name="icon">
        <span class="dot-indicator"></span>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: [Number, String], default: 0 },
  description: { type: String, default: "" },
  variant: {
    type: String,
    default: "default", // default, warning, info, success, danger
  },
});
</script>

<style scoped>
.kpi-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.kpi-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-number {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0.25rem 0;
  color: var(--text-main);
}

.kpi-desc {
  font-size: 0.775rem;
  color: var(--text-muted);
}

.kpi-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-muted);
}

/* Color Variants */
.kpi-warning .kpi-number { color: #d97706; }
.kpi-warning .kpi-icon-box { background-color: #fef3c7; color: #b45309; }

.kpi-info .kpi-number { color: #2563eb; }
.kpi-info .kpi-icon-box { background-color: #dbeafe; color: #1d4ed8; }

.kpi-success .kpi-number { color: #059669; }
.kpi-success .kpi-icon-box { background-color: #d1fae5; color: #047857; }

.kpi-danger .kpi-number { color: #dc2626; }
.kpi-danger .kpi-icon-box { background-color: #fee2e2; color: #b91c1c; }
</style>
