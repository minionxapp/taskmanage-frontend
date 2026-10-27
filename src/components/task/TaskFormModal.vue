<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">
            {{ isKadep || isAdmin ? "Buat Tugas Baru" : "Ajukan Usulan Tugas Baru" }}
          </h3>
          <p class="modal-subtitle">
            <span v-if="isKadep || isAdmin">Tugas yang dibuat akan langsung berstatus <strong>Siap Dikerjakan (TODO)</strong></span>
            <span v-else>Usulan tugas akan masuk ke antrean <strong>Usulan (Menunggu Persetujuan Kadep)</strong></span>
          </p>
        </div>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Title -->
        <div class="form-group">
          <label class="form-label" for="task-title">Judul Tugas <span class="required">*</span></label>
          <input
            id="task-title"
            v-model="form.title"
            type="text"
            class="form-control"
            placeholder="Contoh: Implementasi Audit Log Exporter"
            required
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label" for="task-desc">Deskripsi Tugas</label>
          <textarea
            id="task-desc"
            v-model="form.description"
            rows="3"
            class="form-control"
            placeholder="Jelaskan ruang lingkup tugas, kriteria hasil, dan catatan teknis..."
          ></textarea>
        </div>

        <!-- Departemen & Prioritas -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label" for="task-department">Departemen <span class="required">*</span></label>
            <div v-if="!isAdmin" class="locked-department-box" id="task-department">
              <span class="locked-dept-name">{{ userDepartmentName }}</span>
              <span class="locked-dept-badge">Departemen Anda</span>
            </div>
            <select
              v-else
              id="task-department"
              v-model="form.department_id"
              class="form-control"
              @change="handleDepartmentChange"
              required
            >
              <option value="" disabled>-- Pilih Departemen --</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="task-priority">Prioritas</label>
            <select id="task-priority" v-model="form.priority" class="form-control">
              <option value="LOW">Rendah (Low)</option>
              <option value="MEDIUM">Sedang (Medium)</option>
              <option value="HIGH">Tinggi (High)</option>
              <option value="URGENT">Mendesak (Urgent)</option>
            </select>
          </div>
        </div>

        <!-- Due Date, Assignee & Reporter -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label" for="task-due-date">Batas Waktu (Due Date)</label>
            <input
              id="task-due-date"
              v-model="form.due_date"
              type="date"
              class="form-control"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="task-assignee">Pelaksana (Assignee)</label>
            <select id="task-assignee" v-model="form.assignee_id" class="form-control">
              <option value="">-- Tanpa Pelaksana --</option>
              <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                {{ member.full_name || member.name }} ({{ member.email }})
              </option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="task-reporter">Reporter Tugas</label>
            <select id="task-reporter" v-model="form.reporter_id" class="form-control">
              <option value="">-- Otomatis (Pembuat Tugas) --</option>
              <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                {{ member.full_name || member.name }} ({{ member.email }})
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting || !form.title">
            {{ submitting ? "Menyimpan..." : (isKadep || isAdmin ? "Simpan Tugas" : "Kirim Usulan Tugas") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useTaskStore } from "../../stores/task.js";
import { useTeamStore } from "../../stores/dashboard.js";
import { useToastStore } from "../../stores/toast.js";
import { departmentApi, teamApi } from "../../api/common-api.js";

const emit = defineEmits(["close", "saved"]);

const authStore = useAuthStore();
const taskStore = useTaskStore();
const teamStore = useTeamStore();
const toastStore = useToastStore();

const isKadep = authStore.isKadep;
const isAdmin = authStore.isAdmin;

const submitting = ref(false);
const teamMembers = ref([]);
const departments = ref([]);

const form = reactive({
  title: "",
  description: "",
  department_id: "",
  priority: "MEDIUM",
  due_date: "",
  assignee_id: "",
  reporter_id: "",
});

const userDepartmentName = computed(() => {
  if (authStore.user?.department_name) {
    return authStore.user.department_name;
  }
  const found = departments.value.find((d) => d.id === form.department_id);
  return found ? found.name : "Departemen Anda";
});

const loadTeamMembers = async (deptId = null) => {
  try {
    const res = await teamApi.listMembers(deptId);
    teamMembers.value = res.data || [];
  } catch (err) {
    console.error("Gagal load team members:", err);
  }
};

const handleDepartmentChange = async () => {
  if (form.department_id) {
    await loadTeamMembers(form.department_id);
  }
};

onMounted(async () => {
  try {
    const deptsRes = await departmentApi.listDepartments();
    departments.value = deptsRes.data || [];

    // Set default department from current user or first available
    if (authStore.user?.department_id) {
      form.department_id = authStore.user.department_id;
    } else if (departments.value.length > 0) {
      form.department_id = departments.value[0].id;
    }

    await loadTeamMembers(form.department_id || null);
  } catch (err) {
    console.error("Gagal inisialisasi data form tugas:", err);
  }
});

const handleSubmit = async () => {
  if (!form.title) return;
  submitting.value = true;
  try {
    const departmentIdToUse = !isAdmin.value
      ? authStore.user?.department_id || form.department_id
      : form.department_id || undefined;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      department_id: departmentIdToUse,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      assigned_to_id: form.assignee_id || undefined,
      assignee_id: form.assignee_id || undefined,
      reporter_id: form.reporter_id || authStore.user?.id || undefined,
    };

    await taskStore.createTask(payload);
    toastStore.success(
      isKadep.value || isAdmin.value
        ? "Tugas berhasil dibuat dan siap dikerjakan!"
        : "Usulan tugas berhasil dikirim ke Kadep."
    );
    form.title = "";
    form.description = "";
    form.priority = "MEDIUM";
    form.due_date = "";
    form.assignee_id = "";
    form.reporter_id = "";
    emit("saved");
    emit("close");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal membuat tugas");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
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
  margin-bottom: 0.25rem;
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
.close-btn:hover {
  color: var(--text-main);
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

.locked-department-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background-color: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  min-height: 42px;
}

.locked-dept-name {
  font-weight: 600;
  color: var(--text-main, #1e293b);
  font-size: 0.875rem;
}

.locked-dept-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
</style>
