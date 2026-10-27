<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content task-detail-dialog">
      <!-- Loading indicator -->
      <div v-if="loading && !task" class="dialog-loading">
        <div class="spinner"></div>
        <p>Memuat rincian tugas...</p>
      </div>

      <template v-else-if="task">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-badges">
            <span class="task-id-badge modal-id-badge">{{ task.id }}</span>
            <span class="badge" :class="getPriorityClass(task.priority)">
              Prioritas: {{ formatPriority(task.priority) }}
            </span>
            <span class="badge" :class="getStatusBadgeClass(task.status)">
              Status: {{ formatStatus(task.status) }}
            </span>
            <span v-if="task.due_date" class="due-badge" :class="{ 'is-overdue': isOverdue(task.due_date, task.status) }">
              📅 Batas: {{ formatDate(task.due_date) }}
            </span>
          </div>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <!-- Task Title & Meta -->
        <div class="task-title-section">
          <!-- View Mode -->
          <div v-if="!isEditingTitleDesc" class="title-view-mode">
            <div class="title-header-row">
              <h2 class="task-main-title">
                <span class="title-task-id">[{{ task.id }}]</span> {{ task.title }}
              </h2>
              <button
                v-if="canEditTitleDesc"
                type="button"
                class="btn-edit-title-desc"
                @click="startEditTitleDesc"
                title="Edit judul dan deskripsi tugas"
              >
                ✏️ Edit
              </button>
            </div>
            <p v-if="task.description" class="task-main-desc">{{ task.description }}</p>
            <p v-else-if="canEditTitleDesc" class="task-main-desc empty-desc" @click="startEditTitleDesc">
              <em>(Belum ada deskripsi. Klik di sini untuk menambahkan...)</em>
            </p>
          </div>

          <!-- Edit Mode Form -->
          <form v-else @submit.prevent="saveTitleDesc" class="title-edit-form">
            <div class="edit-field">
              <label class="edit-label">Judul Tugas <span class="required">*</span></label>
              <input
                ref="titleInputRef"
                v-model="titleDescForm.title"
                type="text"
                class="form-control edit-title-input"
                placeholder="Judul tugas..."
                required
                minlength="3"
                maxlength="255"
                :disabled="savingTitleDesc"
              />
            </div>
            <div class="edit-field">
              <label class="edit-label">Deskripsi Tugas</label>
              <textarea
                v-model="titleDescForm.description"
                class="form-control edit-desc-input"
                rows="3"
                placeholder="Tuliskan deskripsi tugas lengkap..."
                :disabled="savingTitleDesc"
              ></textarea>
            </div>
            <div class="edit-field">
              <label class="edit-label">Batas Waktu (Due Date)</label>
              <input
                v-model="titleDescForm.due_date"
                type="date"
                class="form-control edit-date-input"
                :disabled="savingTitleDesc"
              />
            </div>
            <div class="edit-actions">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="cancelEditTitleDesc"
                :disabled="savingTitleDesc"
              >
                Batal
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="savingTitleDesc || !titleDescForm.title || titleDescForm.title.trim().length < 3"
              >
                <span v-if="savingTitleDesc" class="spinner-sm"></span>
                {{ savingTitleDesc ? "Menyimpan..." : "Simpan Perubahan" }}
              </button>
            </div>
          </form>
          
          <div class="task-info-chips">
            <div class="chip">
              <span class="chip-label">Pelaksana:</span>
              <select
                v-if="canManageAssignee && task.status !== 'DONE'"
                :value="task.assigned_to_id || ''"
                @change="handleUpdateAssignee($event.target.value)"
                class="chip-select"
                :disabled="updatingAssignee"
                title="Pilih atau ubah pelaksana tugas"
              >
                <option value="">Belum Ditugaskan</option>
                <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                  {{ member.full_name || member.name }}
                </option>
              </select>
              <span v-else class="chip-value">{{ task.assignee?.full_name || task.assignee?.name || "Belum Ditugaskan" }}</span>
            </div>
            <div class="chip">
              <span class="chip-label">Reporter:</span>
              <select
                v-if="canManageAssignee && task.status !== 'DONE'"
                :value="task.reporter_id || ''"
                @change="handleUpdateReporter($event.target.value)"
                class="chip-select"
                :disabled="updatingReporter"
                title="Pilih atau ubah reporter tugas"
              >
                <option value="">Tanpa Reporter</option>
                <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                  {{ member.full_name || member.name }}
                </option>
              </select>
              <span v-else class="chip-value">{{ task.reporter?.full_name || task.reporter?.name || "-" }}</span>
            </div>
            <div class="chip">
              <span class="chip-label">Departemen:</span>
              <select
                v-if="isAdmin && task.status !== 'DONE' && departments.length > 0"
                :value="task.department_id || ''"
                @change="handleUpdateDepartment($event.target.value)"
                class="chip-select"
                :disabled="updatingDepartment"
                title="Pilih atau ubah departemen tugas"
              >
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
              </select>
              <span v-else class="chip-value">{{ task.department?.name || "-" }}</span>
            </div>
            <div class="chip">
              <span class="chip-label">Batas Waktu:</span>
              <input
                v-if="canEditTitleDesc && task.status !== 'DONE'"
                type="date"
                class="chip-date-input"
                :value="taskDueDateInputValue"
                @change="handleUpdateTaskDueDate($event.target.value)"
                :disabled="updatingDueDate"
                title="Pilih atau ubah batas waktu tugas"
              />
              <span v-else class="chip-value" :class="{ 'text-danger font-bold': isOverdue(task.due_date, task.status) }">
                {{ task.due_date ? formatDate(task.due_date) : "Tanpa Batas" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'subtasks' }"
            @click="activeTab = 'subtasks'"
          >
            Sub Task
            <span class="tab-badge" v-if="task.subtasks">{{ completedSubtasksCount }}/{{ task.subtasks.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'attachments' }"
            @click="activeTab = 'attachments'"
          >
            Lampiran
            <span class="tab-badge">{{ (task.attachments?.length || 0) + (task.links?.length || 0) }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'approvals' }"
            @click="loadApprovalsTab"
          >
            Log
            <span class="tab-badge">{{ approvals.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'comments' }"
            @click="activeTab = 'comments'"
          >
            Komentar
            <span class="tab-badge">{{ totalCommentsCount }}</span>
          </button>
        </div>

        <!-- Tab 1: Subtasks Checklist -->
        <div v-if="activeTab === 'subtasks'" class="tab-content">
          <!-- Progress Bar -->
          <div class="progress-section">
            <div class="progress-labels">
              <span>Progres Keseluruhan Subtugas</span>
              <strong v-if="totalSubtasksCount > 0">{{ taskProgressPercentage }}% Selesai ({{ completedSubtasksCount }}/{{ totalSubtasksCount }})</strong>
              <strong v-else-if="task.status === 'DONE'">100% Selesai</strong>
              <strong v-else class="text-muted">Belum ada subtugas</strong>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${totalSubtasksCount > 0 ? taskProgressPercentage : (task.status === 'DONE' ? 100 : 0)}%` }"
                :class="(totalSubtasksCount > 0 ? taskProgressPercentage : (task.status === 'DONE' ? 100 : 0)) === 100 ? 'fill-done' : 'fill-primary'"
              ></div>
            </div>
            <p v-if="task.status === 'IN_PROGRESS' && totalSubtasksCount > 0 && !isAllSubtasksCompleted" class="subtask-alert">
              ⚠️ Seluruh subtugas harus diselesaikan sebelum mengajukan verifikasi penyelesaian ke Kadep.
            </p>
          </div>

          <!-- Add Subtask Form -->
          <form @submit.prevent="handleAddSubtask" class="add-subtask-form-card" v-if="task.status !== 'DONE'">
            <div class="subtask-input-row">
              <input 
                v-model="newSubtaskTitle" 
                type="text" 
                placeholder="Tambahkan item subtugas baru..." 
                class="form-control subtask-title-input"
                :disabled="addingSubtask"
              />
            </div>
            <div class="subtask-meta-row">
              <div class="subtask-field-group">
                <label class="subtask-field-label">Pelaksana (PIC):</label>
                <select v-model="newSubtaskAssigneeId" class="form-control form-control-sm subtask-select" :disabled="addingSubtask">
                  <option value="">Tanpa Pelaksana</option>
                  <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                    {{ member.full_name || member.name }}
                  </option>
                </select>
              </div>

              <div class="subtask-field-group">
                <label class="subtask-field-label">Tenggat Waktu:</label>
                <input 
                  v-model="newSubtaskDueDate" 
                  type="date" 
                  class="form-control form-control-sm subtask-date"
                  :disabled="addingSubtask"
                />
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-sm btn-add-subtask" 
                :disabled="!newSubtaskTitle.trim() || addingSubtask"
              >
                <span v-if="addingSubtask" class="spinner-sm"></span>
                {{ addingSubtask ? "Menambah..." : "+ Tambah Subtugas" }}
              </button>
            </div>
          </form>

          <!-- Subtasks List -->
          <div class="subtasks-list">
            <div v-if="!task.subtasks || task.subtasks.length === 0" class="empty-subtasks">
              Belum ada checklist subtugas. Tambahkan di atas untuk memecah tugas menjadi langkah-langkah terstruktur.
            </div>
            <div 
              v-for="sub in task.subtasks" 
              :key="sub.id" 
              class="subtask-row"
              :class="{ 'subtask-done': sub.is_completed, 'is-editing-subtask': editingSubtaskId === sub.id }"
            >
              <!-- View Mode -->
              <template v-if="editingSubtaskId !== sub.id">
                <label class="checkbox-container">
                  <input 
                    type="checkbox" 
                    :checked="sub.is_completed" 
                    @change="handleToggleSubtask(sub)"
                    :disabled="togglingSubtaskId === sub.id || task.status === 'DONE'"
                  />
                  <span class="checkmark"></span>
                  <span class="subtask-title-text">{{ sub.title }}</span>
                </label>

                <div class="subtask-meta-right">
                  <!-- PIC Badge -->
                  <span 
                    v-if="sub.assignee" 
                    class="subtask-pic-badge" 
                    :title="`Pelaksana: ${sub.assignee.full_name || sub.assignee.email}`"
                  >
                    <span class="avatar-circle-nano">{{ getInitials(sub.assignee.full_name || sub.assignee.email) }}</span>
                    <span class="subtask-pic-name">{{ sub.assignee.full_name || sub.assignee.email }}</span>
                  </span>

                  <!-- Due Date Editor / Badge -->
                  <div v-if="task.status !== 'DONE'" class="subtask-due-wrapper">
                    <div 
                      class="subtask-due-box" 
                      :class="{ 
                        'is-overdue': isOverdue(sub.due_date, sub.is_completed ? 'DONE' : 'IN_PROGRESS'),
                        'has-due': !!sub.due_date 
                      }"
                      @click="triggerDatePicker($event)"
                      :title="sub.due_date ? `Batas waktu: ${formatDate(sub.due_date)} (klik untuk mengubah)` : 'Atur batas waktu subtugas'"
                    >
                      <span class="due-cal-icon">📅</span>
                      <input 
                        type="date" 
                        class="subtask-date-input"
                        :value="formatDateInput(sub.due_date)"
                        @click.stop="triggerDatePicker($event)"
                        @change="handleUpdateSubtaskDueDate(sub, $event.target.value)"
                        :disabled="updatingSubtaskId === sub.id"
                      />
                    </div>
                    <button 
                      v-if="sub.due_date" 
                      type="button" 
                      class="btn-clear-sub-due" 
                      @click.stop="handleUpdateSubtaskDueDate(sub, '')" 
                      title="Hapus batas waktu subtugas"
                    >
                      &times;
                    </button>
                  </div>
                  <span 
                    v-else-if="sub.due_date" 
                    class="subtask-due-badge" 
                    :class="{ 'is-overdue': isOverdue(sub.due_date, 'DONE') }"
                  >
                    📅 {{ formatDate(sub.due_date) }}
                  </span>

                  <!-- Edit Subtask Button -->
                  <button 
                    v-if="task.status !== 'DONE'"
                    type="button"
                    class="edit-subtask-btn" 
                    @click="startEditSubtask(sub)"
                    title="Edit subtugas (judul, pelaksana, batas waktu)"
                  >
                    ✏️
                  </button>

                  <!-- Delete Button -->
                  <button 
                    v-if="task.status !== 'DONE'"
                    type="button"
                    class="delete-subtask-btn" 
                    @click="handleDeleteSubtask(sub.id)"
                    title="Hapus subtugas"
                  >
                    &times;
                  </button>
                </div>
              </template>

              <!-- Inline Edit Form -->
              <form v-else @submit.prevent="saveEditSubtask(sub.id)" class="subtask-inline-edit-form">
                <div class="inline-edit-inputs">
                  <input 
                    v-model="editingSubtaskForm.title"
                    type="text"
                    class="form-control form-control-sm edit-sub-title"
                    placeholder="Judul subtugas..."
                    required
                    minlength="2"
                    maxlength="255"
                    :disabled="savingSubtask"
                  />
                  <select 
                    v-model="editingSubtaskForm.assigned_to_id"
                    class="form-control form-control-sm edit-sub-pic"
                    :disabled="savingSubtask"
                  >
                    <option value="">Tanpa Pelaksana</option>
                    <option v-for="member in teamMembers" :key="member.id || member.user_id" :value="member.id || member.user_id">
                      {{ member.full_name || member.name }}
                    </option>
                  </select>
                  <input 
                    v-model="editingSubtaskForm.due_date"
                    type="date"
                    class="form-control form-control-sm edit-sub-date"
                    :disabled="savingSubtask"
                    title="Batas waktu subtugas"
                  />
                </div>
                <div class="inline-edit-actions">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-xs"
                    @click="cancelEditSubtask"
                    :disabled="savingSubtask"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    class="btn btn-primary btn-xs"
                    :disabled="savingSubtask || !editingSubtaskForm.title.trim()"
                  >
                    {{ savingSubtask ? "..." : "Simpan" }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tab 2: Attachments & Links -->
        <div v-if="activeTab === 'attachments'" class="tab-content">
          <!-- Upload File Section -->
          <div class="attachment-block">
            <h4 class="section-title">Unggah Berkas Pendukung (Max 25MB)</h4>
            <div class="upload-control">
              <input 
                type="file" 
                ref="fileInput" 
                @change="onFileSelected" 
                class="file-input-native" 
                id="file-upload" 
              />
              <label for="file-upload" class="btn btn-secondary btn-sm">
                📁 Pilih Berkas
              </label>
              <span class="selected-filename">{{ selectedFile ? selectedFile.name : "Belum ada berkas dipilih" }}</span>
              <button 
                class="btn btn-primary btn-sm" 
                @click="handleUploadFile" 
                :disabled="!selectedFile || uploadingFile"
              >
                {{ uploadingFile ? "Mengunggah..." : "Upload" }}
              </button>
            </div>

            <!-- List Attachments -->
            <div class="files-list">
              <div v-if="!task.attachments || task.attachments.length === 0" class="empty-text">
                Belum ada lampiran berkas.
              </div>
              <div v-for="att in task.attachments" :key="att.id" class="attachment-item">
                <div class="att-info">
                  <span class="file-icon">📄</span>
                  <div>
                    <div class="att-name">{{ att.file_name }}</div>
                    <div class="att-meta">{{ formatBytes(att.file_size) }} • Diunggah {{ formatDate(att.created_at) }}</div>
                  </div>
                </div>
                <div class="att-actions">
                  <button class="btn btn-secondary btn-sm" @click="handleDownloadFile(att)" title="Unduh Berkas">
                    ⬇ Unduh
                  </button>
                  <button class="delete-icon-btn" @click="handleDeleteAttachment(att.id)" title="Hapus">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Link Section -->
          <div class="attachment-block">
            <h4 class="section-title">Tautan Eksternal (URL)</h4>
            <form @submit.prevent="handleAddLink" class="link-form">
              <input 
                v-model="newLink.title" 
                type="text" 
                placeholder="Judul tautan (cth: Dokumen Google Drive)" 
                class="form-control" 
                required 
              />
              <input 
                v-model="newLink.url" 
                type="url" 
                placeholder="https://..." 
                class="form-control" 
                required 
              />
              <button type="submit" class="btn btn-primary btn-sm" :disabled="addingLink">
                + Tambah Tautan
              </button>
            </form>

            <!-- List Links -->
            <div class="links-list">
              <div v-if="!task.links || task.links.length === 0" class="empty-text">
                Belum ada tautan eksternal.
              </div>
              <div v-for="lnk in task.links" :key="lnk.id" class="link-item">
                <div class="link-info">
                  <span class="link-icon">🔗</span>
                  <div>
                    <a :href="lnk.url" target="_blank" rel="noopener noreferrer" class="link-url-text">
                      {{ lnk.title }}
                    </a>
                    <div class="link-raw">{{ lnk.url }}</div>
                  </div>
                </div>
                <button class="delete-icon-btn" @click="handleDeleteLink(lnk.id)" title="Hapus Tautan">
                  🗑
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Approvals Audit History -->
        <div v-if="activeTab === 'approvals'" class="tab-content">
          <div v-if="loadingApprovals" class="dialog-loading">
            <div class="spinner"></div>
            <p>Memuat riwayat persetujuan...</p>
          </div>

          <div v-else-if="approvals.length === 0" class="empty-state">
            <div class="empty-icon">🛡️</div>
            <p>Belum ada catatan persetujuan untuk tugas ini.</p>
          </div>

          <div v-else class="approval-timeline">
            <div v-for="app in approvals" :key="app.id" class="timeline-item">
              <div class="timeline-badge" :class="getDecisionClass(app.decision)">
                {{ getDecisionIcon(app.decision) }}
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="gate-tag">{{ formatGateType(app.stage || app.gate_type) }}</span>
                  <span class="timeline-date">{{ formatDateTime(app.created_at) }}</span>
                </div>
                <div class="timeline-body">
                  <strong>{{ app.reviewer?.full_name || app.reviewer?.name || app.approver?.name || "Kepala Departemen" }}</strong>
                  telah 
                  <span :class="getDecisionTextClass(app.decision)">{{ formatDecision(app.decision) }}</span>.
                </div>
                <div v-if="app.notes" class="timeline-notes">
                  "{{ app.notes }}"
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Komentar (Dengan Fitur Reply) -->
        <div v-if="activeTab === 'comments'" class="tab-content">
          <!-- Input Form Komentar Utama -->
          <div class="comment-input-card">
            <div class="comment-form-header">
              <div class="user-avatar-mini">{{ getInitials(authStore.user?.full_name || authStore.user?.name) }}</div>
              <span class="user-name-tag">{{ authStore.user?.full_name || authStore.user?.name || "Pengguna" }}</span>
            </div>
            <textarea
              v-model="newCommentText"
              class="form-control comment-textarea"
              rows="3"
              placeholder="Tulis tanggapan atau komentar terkait tugas ini..."
              :disabled="submittingComment"
            ></textarea>
            <div class="comment-form-footer">
              <span class="char-count">{{ newCommentText.length }}/2000</span>
              <button
                class="btn btn-primary btn-sm"
                @click="handleAddComment"
                :disabled="!newCommentText.trim() || submittingComment"
              >
                <span v-if="submittingComment" class="spinner-sm"></span>
                {{ submittingComment ? "Mengirim..." : "💬 Kirim Komentar" }}
              </button>
            </div>
          </div>

          <!-- Daftar Komentar & Balasan -->
          <div class="comments-section">
            <div v-if="!task.comments || task.comments.length === 0" class="empty-state">
              <p>Belum ada komentar pada tugas ini. Jadilah yang pertama memberikan tanggapan!</p>
            </div>

            <div v-else class="comments-list">
              <div v-for="c in task.comments" :key="c.id" class="comment-thread">
                <!-- Kartu Komentar Utama -->
                <div class="comment-card">
                  <div class="comment-header">
                    <div class="comment-author-info">
                      <div class="avatar-circle-sm" :class="`role-${c.user?.role?.toLowerCase() || 'member'}`">
                        {{ getInitials(c.user?.full_name || c.user?.email) }}
                      </div>
                      <div>
                        <div class="comment-author-name">
                          <strong>{{ c.user?.full_name || c.user?.email || "Pengguna" }}</strong>
                          <span class="role-pill" :class="`pill-${c.user?.role?.toLowerCase() || 'member'}`">
                            {{ formatRole(c.user?.role) }}
                          </span>
                        </div>
                        <span class="comment-time">{{ formatDateTime(c.created_at) }}</span>
                      </div>
                    </div>

                    <div class="comment-actions">
                      <button class="btn-reply" @click="handleOpenReply(c.id)">
                        ↩ Balas
                      </button>
                      <button
                        v-if="canDeleteComment(c)"
                        class="btn-delete-comment"
                        @click="handleDeleteComment(c.id)"
                        title="Hapus Komentar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div class="comment-body">
                    {{ c.content }}
                  </div>
                </div>

                <!-- Inline Reply Box (Ketika Membalas Komentar Utama Ini) -->
                <div v-if="replyingToId === c.id" class="reply-input-card">
                  <div class="reply-prompt">
                    <span>Membalas kepada <strong>{{ c.user?.full_name || "Pengguna" }}</strong>:</span>
                    <button class="btn-cancel-reply" @click="handleCancelReply">✕ Batal</button>
                  </div>
                  <textarea
                    v-model="replyText"
                    class="form-control reply-textarea"
                    rows="2"
                    placeholder="Tulis balasan Anda..."
                    :disabled="submittingReply"
                    autoFocus
                  ></textarea>
                  <div class="reply-form-footer">
                    <button class="btn btn-secondary btn-sm" @click="handleCancelReply">Batal</button>
                    <button
                      class="btn btn-primary btn-sm"
                      @click="handleSubmitReply(c.id)"
                      :disabled="!replyText.trim() || submittingReply"
                    >
                      <span v-if="submittingReply" class="spinner-sm"></span>
                      {{ submittingReply ? "Mengirim..." : "Kirim Balasan" }}
                    </button>
                  </div>
                </div>

                <!-- Daftar Balasan Bersarang (Replies Thread) -->
                <div v-if="c.replies && c.replies.length > 0" class="replies-list">
                  <div v-for="rep in c.replies" :key="rep.id" class="reply-card">
                    <div class="comment-header">
                      <div class="comment-author-info">
                        <div class="avatar-circle-xs" :class="`role-${rep.user?.role?.toLowerCase() || 'member'}`">
                          {{ getInitials(rep.user?.full_name || rep.user?.email) }}
                        </div>
                        <div>
                          <div class="comment-author-name">
                            <strong>{{ rep.user?.full_name || rep.user?.email || "Pengguna" }}</strong>
                            <span class="role-pill" :class="`pill-${rep.user?.role?.toLowerCase() || 'member'}`">
                              {{ formatRole(rep.user?.role) }}
                            </span>
                          </div>
                          <span class="comment-time">{{ formatDateTime(rep.created_at) }}</span>
                        </div>
                      </div>

                      <div class="comment-actions">
                        <button class="btn-reply" @click="handleOpenReply(c.id, rep.user?.full_name)">
                          ↩ Balas
                        </button>
                        <button
                          v-if="canDeleteComment(rep)"
                          class="btn-delete-comment"
                          @click="handleDeleteComment(rep.id)"
                          title="Hapus Balasan"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div class="comment-body">
                      {{ rep.content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Decision Notes Dialog Prompt Overlay (if rejecting/requesting revision) -->
        <Teleport to="body">
          <div v-if="showNotesModal" class="modal-overlay delete-confirm-overlay" @click.self="showNotesModal = false">
            <div class="modal-content notes-modal-box">
              <h4>{{ notesModalTitle }}</h4>
              <p class="notes-modal-desc">{{ notesModalDesc }}</p>
              <textarea 
                v-model="decisionNotes" 
                class="form-control" 
                rows="3" 
                placeholder="Berikan alasan atau catatan perbaikan..."
                required
              ></textarea>
              <div class="notes-modal-actions">
                <button class="btn btn-secondary btn-sm" @click="showNotesModal = false">Batal</button>
                <button 
                  class="btn btn-sm" 
                  :class="notesModalBtnClass" 
                  @click="confirmDecisionWithNotes"
                  :disabled="!decisionNotes.trim() || processingApproval"
                >
                  <span v-if="processingApproval" class="spinner-sm"></span>
                  {{ processingApproval ? "Memproses..." : "Konfirmasi" }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- Bottom Action Bar (Contextual Two-Gate & Task Workflow) -->
        <div class="dialog-footer">
          <!-- Usulan: Kadep / Admin approval on PENDING_CREATION_APPROVAL -->
          <div v-if="task.status === 'PENDING_CREATION_APPROVAL' && (isKadep || isAdmin)" class="action-group">
            <span class="action-info">Usulan Tugas Menunggu Persetujuan Kadep</span>
            <div class="btn-group">
              <button class="btn btn-danger btn-sm" @click="openNotesDialog('REJECT_CREATION')">
                ✕ Tolak Usulan
              </button>
              <button class="btn btn-success btn-sm" @click="handleApproveCreation" :disabled="processingApproval">
                ✓ Setujui Usulan Tugas
              </button>
            </div>
          </div>

          <!-- Workflow: TODO -> IN_PROGRESS (Mulai Kerjakan) -->
          <div v-else-if="task.status === 'TODO'" class="action-group">
            <span class="action-info">Tugas sudah disetujui dan siap dikerjakan</span>
            <button class="btn btn-primary btn-sm" @click="handleStartWorking" :disabled="processingStatus">
              ▶ Mulai Kerjakan Tugas
            </button>
          </div>

          <!-- Workflow: IN_PROGRESS -> PENDING_COMPLETION_APPROVAL (Ajukan Selesai) -->
          <div v-else-if="task.status === 'IN_PROGRESS'" class="action-group">
            <span class="action-info">
              {{ isAllSubtasksCompleted ? "Semua subtugas rampung!" : "Tugas sedang dalam pengerjaan" }}
            </span>
            <button 
              class="btn btn-success btn-sm" 
              @click="handleRequestCompletion" 
              :disabled="!isAllSubtasksCompleted || processingStatus"
              :title="!isAllSubtasksCompleted ? 'Selesaikan seluruh subtugas terlebih dahulu' : 'Ajukan ke Kadep'"
            >
              🏁 Ajukan Verifikasi ke Kadep
            </button>
          </div>

          <!-- Verifikasi: Kadep / Admin review on PENDING_COMPLETION_APPROVAL -->
          <div v-else-if="task.status === 'PENDING_COMPLETION_APPROVAL' && (isKadep || isAdmin)" class="action-group">
            <span class="action-info">Verifikasi Hasil Tugas oleh Kepala Departemen</span>
            <div class="btn-group">
              <button class="btn btn-warning btn-sm" @click="openNotesDialog('REVISION')">
                ↩ Revisi
              </button>
              <button class="btn btn-success btn-sm" @click="handleApproveCompletion" :disabled="processingApproval">
                ✓ Setujui
              </button>
            </div>
          </div>

          <!-- Status Done -->
          <div v-else-if="task.status === 'DONE'" class="action-group">
            <span class="action-info done-text">✓ Tugas ini telah selesai dan diverifikasi resmi oleh Kepala Departemen.</span>
          </div>

          <!-- Actions & Close button -->
          <div class="footer-btn-group">
            <button 
              v-if="canDeleteTask" 
              class="btn btn-danger btn-sm" 
              @click="handleDeleteTask"
              :disabled="deletingTask"
            >
              {{ deletingTask ? "Menghapus..." : "🗑 Hapus Tugas" }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="$emit('close')">Tutup</button>
          </div>
        </div>

        <!-- In-App Delete Confirmation Modal (100% Terlihat & Elegan) -->
        <Teleport to="body">
          <div 
            v-if="showDeleteConfirmModal" 
            class="modal-overlay delete-confirm-overlay" 
            @click.self="showDeleteConfirmModal = false"
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
                  <span class="task-id-badge">{{ task?.id }}</span>
                  <span class="task-target-title">{{ task?.title }}</span>
                </div>
                <div class="delete-warning-note">
                  ⚠️ Seluruh subtugas, berkas lampiran, dan riwayat persetujuan tugas ini akan ikut dihapus.
                </div>
              </div>

              <div class="delete-actions">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  @click="showDeleteConfirmModal = false" 
                  :disabled="deletingTask"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  class="btn btn-danger" 
                  @click="executeDeleteTask" 
                  :disabled="deletingTask"
                >
                  <span v-if="deletingTask" class="spinner-sm"></span>
                  {{ deletingTask ? "Menghapus..." : "Ya, Hapus Sekarang" }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useTaskStore } from "../../stores/task.js";
import { useTeamStore } from "../../stores/dashboard.js";
import { useToastStore } from "../../stores/toast.js";
import { taskApi } from "../../api/task-api.js";
import { departmentApi } from "../../api/common-api.js";

const props = defineProps({
  taskId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "updated", "deleted"]);

const authStore = useAuthStore();
const taskStore = useTaskStore();
const teamStore = useTeamStore();
const toastStore = useToastStore();

const isKadep = computed(() => authStore.isKadep);
const isAdmin = computed(() => authStore.isAdmin);

const loading = ref(false);
const task = ref(null);
const activeTab = ref("subtasks");
const teamMembers = ref([]);
const departments = ref([]);

// Subtasks state
const newSubtaskTitle = ref("");
const newSubtaskAssigneeId = ref("");
const newSubtaskDueDate = ref("");
const addingSubtask = ref(false);
const togglingSubtaskId = ref(null);

// Attachments & Links state
const fileInput = ref(null);
const selectedFile = ref(null);
const uploadingFile = ref(false);
const newLink = ref({ title: "", url: "" });
const addingLink = ref(false);

// Approvals state
const approvals = ref([]);
const loadingApprovals = ref(false);

// Workflow state
const processingStatus = ref(false);
const processingApproval = ref(false);

// Notes Modal state
const showNotesModal = ref(false);
const pendingActionType = ref("");
const decisionNotes = ref("");
const notesModalTitle = ref("");
const notesModalDesc = ref("");
const notesModalBtnClass = ref("btn-danger");

const totalSubtasksCount = computed(() => {
  return task.value?.subtasks?.length || 0;
});

const completedSubtasksCount = computed(() => {
  if (!task.value?.subtasks) return 0;
  return task.value.subtasks.filter((s) => s.is_completed).length;
});

const taskProgressPercentage = computed(() => {
  if (!task.value) return 0;
  if (!task.value.subtasks || task.value.subtasks.length === 0) {
    return task.value.status === "DONE" ? 100 : (task.value.progress_percentage ?? task.value.progress_percent ?? 0);
  }
  return Math.round((completedSubtasksCount.value / task.value.subtasks.length) * 100);
});

const isAllSubtasksCompleted = computed(() => {
  if (!task.value?.subtasks || task.value.subtasks.length === 0) {
    return true;
  }
  return task.value.subtasks.every((s) => s.is_completed);
});

const canDeleteTask = computed(() => {
  if (!task.value) return false;
  return isKadep.value || isAdmin.value || task.value.created_by_id === authStore.user?.id;
});

const canManageAssignee = computed(() => {
  if (!task.value) return false;
  return isKadep.value || isAdmin.value || task.value.created_by_id === authStore.user?.id;
});

const canEditTitleDesc = computed(() => {
  if (!task.value) return false;
  const currentUserId = authStore.user?.id;
  return (
    isKadep.value ||
    isAdmin.value ||
    task.value.created_by_id === currentUserId ||
    task.value.assigned_to_id === currentUserId ||
    task.value.reporter_id === currentUserId
  );
});

const formatDateInput = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const taskDueDateInputValue = computed(() => {
  return formatDateInput(task.value?.due_date);
});

const isEditingTitleDesc = ref(false);
const savingTitleDesc = ref(false);
const titleInputRef = ref(null);
const titleDescForm = reactive({
  title: "",
  description: "",
  due_date: "",
});

const startEditTitleDesc = async () => {
  if (!task.value) return;
  titleDescForm.title = task.value.title || "";
  titleDescForm.description = task.value.description || "";
  titleDescForm.due_date = formatDateInput(task.value.due_date);
  isEditingTitleDesc.value = true;
  await nextTick();
  if (titleInputRef.value) {
    titleInputRef.value.focus();
  }
};

const cancelEditTitleDesc = () => {
  isEditingTitleDesc.value = false;
  titleDescForm.title = "";
  titleDescForm.description = "";
  titleDescForm.due_date = "";
};

const saveTitleDesc = async () => {
  if (!titleDescForm.title || titleDescForm.title.trim().length < 3) {
    toastStore.error("Judul tugas minimal 3 karakter");
    return;
  }
  savingTitleDesc.value = true;
  try {
    await taskStore.updateTask(props.taskId, {
      title: titleDescForm.title.trim(),
      description: titleDescForm.description.trim() || null,
      due_date: titleDescForm.due_date ? new Date(titleDescForm.due_date).toISOString() : null,
    });
    toastStore.success("Data tugas berhasil diperbarui!");
    isEditingTitleDesc.value = false;
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui tugas");
  } finally {
    savingTitleDesc.value = false;
  }
};

const updatingDueDate = ref(false);
const handleUpdateTaskDueDate = async (newDueDate) => {
  updatingDueDate.value = true;
  try {
    await taskStore.updateTask(props.taskId, {
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
    });
    toastStore.success("Batas waktu tugas berhasil diperbarui!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui batas waktu tugas");
  } finally {
    updatingDueDate.value = false;
  }
};

const updatingAssignee = ref(false);
const handleUpdateAssignee = async (newAssigneeId) => {
  updatingAssignee.value = true;
  try {
    await taskStore.updateTask(props.taskId, {
      assigned_to_id: newAssigneeId || null,
      assignee_id: newAssigneeId || null,
    });
    toastStore.success("Pelaksana tugas berhasil diperbarui!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui pelaksana tugas");
  } finally {
    updatingAssignee.value = false;
  }
};

const updatingReporter = ref(false);
const handleUpdateReporter = async (newReporterId) => {
  updatingReporter.value = true;
  try {
    await taskStore.updateTask(props.taskId, {
      reporter_id: newReporterId || null,
    });
    toastStore.success("Reporter tugas berhasil diperbarui!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui reporter tugas");
  } finally {
    updatingReporter.value = false;
  }
};

const updatingDepartment = ref(false);
const handleUpdateDepartment = async (newDeptId) => {
  if (!newDeptId) return;
  updatingDepartment.value = true;
  try {
    await taskStore.updateTask(props.taskId, {
      department_id: newDeptId,
    });
    toastStore.success("Departemen tugas berhasil diperbarui!");
    await loadTask();
    try {
      const members = await teamStore.fetchMembers(newDeptId);
      teamMembers.value = members || [];
    } catch {}
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui departemen tugas");
  } finally {
    updatingDepartment.value = false;
  }
};

// Comments state
const newCommentText = ref("");
const submittingComment = ref(false);
const replyingToId = ref(null);
const replyText = ref("");
const submittingReply = ref(false);

const totalCommentsCount = computed(() => {
  if (!task.value?.comments) return 0;
  let count = task.value.comments.length;
  task.value.comments.forEach((c) => {
    if (c.replies) count += c.replies.length;
  });
  return count;
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
  switch (role) {
    case "HEAD_OF_DEPARTMENT": return "Kadep";
    case "ADMIN": return "Admin";
    default: return "Anggota";
  }
};

const canDeleteComment = (c) => {
  return authStore.user?.id === c.user_id || isKadep.value || isAdmin.value;
};

const handleOpenReply = (commentId, mentionName = null) => {
  replyingToId.value = commentId;
  replyText.value = mentionName ? `@${mentionName} ` : "";
};

const handleCancelReply = () => {
  replyingToId.value = null;
  replyText.value = "";
};

const handleAddComment = async () => {
  if (!newCommentText.value.trim()) return;
  submittingComment.value = true;
  try {
    await taskApi.createComment(props.taskId, newCommentText.value.trim());
    newCommentText.value = "";
    toastStore.success("Komentar berhasil ditambahkan!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengirim komentar");
  } finally {
    submittingComment.value = false;
  }
};

const handleSubmitReply = async (parentId) => {
  if (!replyText.value.trim()) return;
  submittingReply.value = true;
  try {
    await taskApi.createComment(props.taskId, replyText.value.trim(), parentId);
    replyText.value = "";
    replyingToId.value = null;
    toastStore.success("Balasan berhasil dikirim!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengirim balasan");
  } finally {
    submittingReply.value = false;
  }
};

const handleDeleteComment = async (commentId) => {
  if (!confirm("Hapus komentar ini?")) return;
  try {
    await taskApi.deleteComment(props.taskId, commentId);
    toastStore.success("Komentar berhasil dihapus.");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal menghapus komentar");
  }
};

const deletingTask = ref(false);

const loadTask = async () => {
  loading.value = true;
  try {
    const res = await taskApi.getTaskById(props.taskId);
    task.value = res.data;
  } catch (err) {
    toastStore.error("Gagal memuat detail tugas");
  } finally {
    loading.value = false;
  }
};

const loadApprovalsTab = async () => {
  activeTab.value = "approvals";
  loadingApprovals.value = true;
  try {
    const res = await taskApi.getApprovals(props.taskId);
    approvals.value = res.data || [];
  } catch (err) {
    console.error("Gagal load approvals:", err);
  } finally {
    loadingApprovals.value = false;
  }
};

onMounted(async () => {
  await loadTask();
  // Pre-load approvals count
  try {
    const res = await taskApi.getApprovals(props.taskId);
    approvals.value = res.data || [];
  } catch {}
  // Pre-load team members for subtask assignment & assignee/reporter selection
  try {
    const members = await teamStore.fetchMembers(task.value?.department_id || null);
    teamMembers.value = members || [];
  } catch (err) {
    console.error("Gagal load team members:", err);
  }
  // Pre-load departments if kadep or admin
  if (isKadep.value || isAdmin.value) {
    try {
      const res = await departmentApi.listDepartments();
      departments.value = res.data || [];
    } catch (err) {
      console.error("Gagal load departments:", err);
    }
  }
});

// Subtask actions
const handleAddSubtask = async () => {
  if (!newSubtaskTitle.value.trim()) return;
  addingSubtask.value = true;
  try {
    await taskApi.createSubtask(props.taskId, {
      title: newSubtaskTitle.value.trim(),
      assigned_to_id: newSubtaskAssigneeId.value || undefined,
      due_date: newSubtaskDueDate.value ? new Date(newSubtaskDueDate.value).toISOString() : undefined,
    });
    newSubtaskTitle.value = "";
    newSubtaskAssigneeId.value = "";
    newSubtaskDueDate.value = "";
    toastStore.success("Subtugas berhasil ditambahkan!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal menambah subtugas");
  } finally {
    addingSubtask.value = false;
  }
};

const handleToggleSubtask = async (sub) => {
  togglingSubtaskId.value = sub.id;
  try {
    await taskApi.updateSubtask(props.taskId, sub.id, {
      is_completed: !sub.is_completed,
    });
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error("Gagal memperbarui subtugas");
  } finally {
    togglingSubtaskId.value = null;
  }
};

const triggerDatePicker = (event) => {
  const target = event.target;
  const input = target.tagName === "INPUT" ? target : event.currentTarget?.querySelector('input[type="date"]');
  if (input && typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {}
  }
};

const editingSubtaskId = ref(null);
const savingSubtask = ref(false);
const editingSubtaskForm = reactive({
  title: "",
  assigned_to_id: "",
  due_date: "",
});

const startEditSubtask = (sub) => {
  editingSubtaskId.value = sub.id;
  editingSubtaskForm.title = sub.title || "";
  editingSubtaskForm.assigned_to_id = sub.assigned_to_id || "";
  editingSubtaskForm.due_date = formatDateInput(sub.due_date);
};

const cancelEditSubtask = () => {
  editingSubtaskId.value = null;
  editingSubtaskForm.title = "";
  editingSubtaskForm.assigned_to_id = "";
  editingSubtaskForm.due_date = "";
};

const saveEditSubtask = async (subId) => {
  if (!editingSubtaskForm.title || editingSubtaskForm.title.trim().length < 2) {
    toastStore.error("Judul subtugas minimal 2 karakter");
    return;
  }
  savingSubtask.value = true;
  try {
    await taskApi.updateSubtask(props.taskId, subId, {
      title: editingSubtaskForm.title.trim(),
      assigned_to_id: editingSubtaskForm.assigned_to_id || null,
      due_date: editingSubtaskForm.due_date ? new Date(editingSubtaskForm.due_date).toISOString() : null,
    });
    toastStore.success("Subtugas berhasil diperbarui!");
    editingSubtaskId.value = null;
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui subtugas");
  } finally {
    savingSubtask.value = false;
  }
};

const updatingSubtaskId = ref(null);
const handleUpdateSubtaskDueDate = async (sub, newDueDate) => {
  updatingSubtaskId.value = sub.id;
  try {
    await taskApi.updateSubtask(props.taskId, sub.id, {
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
    });
    toastStore.success("Batas waktu subtugas berhasil diperbarui!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memperbarui batas waktu subtugas");
  } finally {
    updatingSubtaskId.value = null;
  }
};

const handleDeleteSubtask = async (subId) => {
  try {
    await taskApi.deleteSubtask(props.taskId, subId);
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error("Gagal menghapus subtugas");
  }
};

// Attachment actions
const onFileSelected = (e) => {
  selectedFile.value = e.target.files[0] || null;
};

const handleUploadFile = async () => {
  if (!selectedFile.value) return;
  uploadingFile.value = true;
  try {
    await taskApi.uploadAttachment(props.taskId, selectedFile.value);
    toastStore.success("Berkas berhasil diunggah!");
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = "";
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengunggah berkas");
  } finally {
    uploadingFile.value = false;
  }
};

const handleDownloadFile = async (att) => {
  try {
    const res = await taskApi.downloadAttachment(att.id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", att.file_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    toastStore.error("Gagal mengunduh berkas");
  }
};

const handleDeleteAttachment = async (attachmentId) => {
  if (!confirm("Hapus lampiran ini?")) return;
  try {
    await taskApi.deleteAttachment(attachmentId);
    toastStore.success("Lampiran berhasil dihapus");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error("Gagal menghapus lampiran");
  }
};

// Link actions
const handleAddLink = async () => {
  if (!newLink.value.title || !newLink.value.url) return;
  addingLink.value = true;
  try {
    await taskApi.addLink(props.taskId, newLink.value.title, newLink.value.url);
    toastStore.success("Tautan berhasil ditambahkan");
    newLink.value = { title: "", url: "" };
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal menambah tautan");
  } finally {
    addingLink.value = false;
  }
};

const handleDeleteLink = async (linkId) => {
  if (!confirm("Hapus tautan ini?")) return;
  try {
    await taskApi.deleteLink(linkId);
    toastStore.success("Tautan dihapus");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error("Gagal menghapus tautan");
  }
};

const showDeleteConfirmModal = ref(false);

const handleDeleteTask = () => {
  showDeleteConfirmModal.value = true;
};

const executeDeleteTask = async () => {
  deletingTask.value = true;
  try {
    const deletedId = props.taskId;
    const deletedTitle = task.value?.title || "";
    await taskStore.deleteTask(props.taskId);
    toastStore.showSuccess(`Tugas [${deletedId}] berhasil dihapus.`);
    showDeleteConfirmModal.value = false;
    emit("deleted", { id: deletedId, title: deletedTitle });
    emit("close");
  } catch (err) {
    toastStore.showError(err.response?.data?.message || err.message || "Gagal menghapus tugas");
  } finally {
    deletingTask.value = false;
  }
};

// Workflow transitions
const handleStartWorking = async () => {
  processingStatus.value = true;
  try {
    await taskStore.updateStatus(props.taskId, "IN_PROGRESS");
    toastStore.success("Status diubah ke Dikerjakan (IN_PROGRESS)");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengubah status");
  } finally {
    processingStatus.value = false;
  }
};

const handleRequestCompletion = async () => {
  processingStatus.value = true;
  try {
    await taskStore.requestCompletion(props.taskId);
    toastStore.success("Penyelesaian tugas diajukan ke Kepala Departemen!");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal mengajukan penyelesaian");
  } finally {
    processingStatus.value = false;
  }
};

const handleApproveCreation = async () => {
  processingApproval.value = true;
  try {
    await taskStore.approveCreation(props.taskId, "APPROVED", "Disetujui untuk dikerjakan");
    toastStore.success("Usulan tugas disetujui! Siap dikerjakan.");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal menyetujui tugas");
  } finally {
    processingApproval.value = false;
  }
};

const handleApproveCompletion = async () => {
  processingApproval.value = true;
  try {
    await taskStore.approveCompletion(props.taskId, "APPROVED", "Penyelesaian diverifikasi dan diterima");
    toastStore.success("Tugas resmi selesai diverifikasi! Status: DONE.");
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memverifikasi tugas");
  } finally {
    processingApproval.value = false;
  }
};

// Notes Modal handling for Rejection / Revision
const openNotesDialog = (actionType) => {
  pendingActionType.value = actionType;
  decisionNotes.value = "";
  if (actionType === "REJECT_CREATION") {
    notesModalTitle.value = "Tolak Usulan Tugas";
    notesModalDesc.value = "Jelaskan alasan penolakan usulan tugas ini agar pembuat usulan memahami keputusannya:";
    notesModalBtnClass.value = "btn-danger";
  } else if (actionType === "REVISION") {
    notesModalTitle.value = "Revisi Tugas";
    notesModalDesc.value = "Sebutkan bagian atau hasil yang perlu diperbaiki oleh pelaksana tugas:";
    notesModalBtnClass.value = "btn-warning";
  }
  showNotesModal.value = true;
};

const confirmDecisionWithNotes = async () => {
  processingApproval.value = true;
  try {
    if (pendingActionType.value === "REJECT_CREATION") {
      await taskStore.approveCreation(props.taskId, "REJECTED", decisionNotes.value);
      toastStore.success("Usulan tugas ditolak.");
    } else if (pendingActionType.value === "REVISION") {
      await taskStore.approveCompletion(props.taskId, "REVISION_REQUESTED", decisionNotes.value);
      toastStore.success("Revisi dikirimkan ke pelaksana tugas.");
    }
    showNotesModal.value = false;
    await loadTask();
    emit("updated");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Gagal memproses keputusan");
  } finally {
    processingApproval.value = false;
  }
};

// Utilities
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === "DONE") return false;
  return new Date(dateStr) < new Date();
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
    PENDING_CREATION_APPROVAL: "Usulan (Menunggu Kadep)",
    TODO: "Siap Dikerjakan",
    IN_PROGRESS: "Sedang Dikerjakan",
    PENDING_COMPLETION_APPROVAL: "Verifikasi Selesai",
    DONE: "Selesai (Done)",
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

const formatGateType = (gt) => {
  return gt === "CREATION" || gt === "GATE_1_CREATION"
    ? "Usulan Tugas"
    : "Verifikasi Penyelesaian";
};

const formatDecision = (d) => {
  if (d === "APPROVED") return "menyetujui";
  if (d === "REJECTED") return "menolak";
  if (d === "REVISION_REQUESTED") return "meminta revisi";
  return d;
};

const getDecisionClass = (d) => {
  if (d === "APPROVED") return "badge-timeline-success";
  if (d === "REJECTED") return "badge-timeline-danger";
  return "badge-timeline-warning";
};

const getDecisionTextClass = (d) => {
  if (d === "APPROVED") return "text-success";
  if (d === "REJECTED") return "text-danger";
  return "text-warning";
};

const getDecisionIcon = (d) => {
  if (d === "APPROVED") return "✓";
  if (d === "REJECTED") return "✕";
  return "↩";
};
</script>

<style scoped>
.task-detail-dialog {
  max-width: 780px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

.dialog-loading {
  padding: 3rem;
  text-align: center;
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

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.due-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-muted);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

.due-badge.is-overdue {
  color: var(--color-danger);
  background: var(--color-danger-bg);
  font-weight: 600;
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

.task-title-section {
  padding: 1.25rem 1.5rem 0.75rem 1.5rem;
}

.title-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.task-main-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.3;
  margin-bottom: 0;
  flex: 1;
}

.btn-edit-title-desc {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--color-primary, #6366f1);
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-edit-title-desc:hover {
  background: rgba(99, 102, 241, 0.16);
  border-color: var(--color-primary, #6366f1);
  transform: translateY(-1px);
}

.task-main-desc {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.empty-desc {
  color: var(--text-muted);
  cursor: pointer;
  font-style: italic;
  margin-bottom: 1rem;
}

.empty-desc:hover {
  color: var(--color-primary);
}

.title-edit-form {
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 10px);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.edit-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.edit-title-input {
  font-size: 0.95rem;
  font-weight: 600;
}

.edit-desc-input {
  font-size: 0.875rem;
  resize: vertical;
}

.edit-date-input {
  font-size: 0.875rem;
  max-width: 220px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.task-info-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.chip-label {
  color: var(--text-muted);
}

.chip-value {
  font-weight: 600;
  color: var(--text-main);
}

.chip-select {
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--color-primary);
  cursor: pointer;
  outline: none;
  padding: 0;
  font-family: inherit;
}
.chip-select:focus {
  outline: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.chip-date-input {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-main);
  cursor: pointer;
  outline: none;
  padding: 0.1rem 0.35rem;
  font-family: inherit;
}
.chip-date-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.tabs-nav {
  display: flex;
  gap: 0.25rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: #fafafa;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--bg-surface);
}

.tab-badge {
  background: var(--bg-muted);
  color: var(--text-main);
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
}

.tab-content {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  max-height: 48vh;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Subtasks styles */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--bg-app);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-main);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--border-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.fill-primary {
  background: var(--color-primary);
}

.fill-done {
  background: var(--color-success);
}

.subtask-alert {
  font-size: 0.75rem;
  color: #b45309;
  background: #fffbeb;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  margin-top: 0.25rem;
}

.add-subtask-form-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.subtask-input-row {
  width: 100%;
}

.subtask-title-input {
  width: 100%;
  font-size: 0.875rem;
  background: var(--bg-surface);
}

.subtask-meta-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.subtask-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 140px;
}

.subtask-field-label {
  font-size: 0.7188rem;
  font-weight: 600;
  color: var(--text-muted);
}

.subtask-select,
.subtask-date {
  font-size: 0.8125rem;
  padding: 0.35rem 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  height: 34px;
}

.btn-add-subtask {
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  padding: 0 0.875rem;
  font-weight: 600;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-subtasks {
  font-size: 0.8125rem;
  color: var(--text-muted);
  padding: 1rem 0;
  text-align: center;
}

.subtask-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.875rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.subtask-row:hover {
  background: var(--bg-app);
  border-color: #cbd5e1;
}

.subtask-meta-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.subtask-pic-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.avatar-circle-nano {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
}

.subtask-pic-name {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtask-due-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.subtask-due-box {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.4rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.subtask-due-box:hover {
  border-color: var(--color-primary);
  background: #ffffff;
}

.subtask-due-box.has-due {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.subtask-due-box.is-overdue {
  background: #fef2f2;
  border-color: #fecaca;
}

.due-cal-icon {
  font-size: 0.75rem;
  line-height: 1;
  user-select: none;
}

.subtask-date-input {
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-main);
  outline: none;
  cursor: pointer;
  padding: 0;
  max-width: 110px;
}

.subtask-date-input:focus {
  outline: none;
}

.subtask-due-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.subtask-due-badge.is-overdue {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
  font-weight: 600;
}

.btn-clear-sub-due {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.15rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.btn-clear-sub-due:hover {
  color: var(--color-danger);
}

.edit-subtask-btn {
  background: transparent;
  border: none;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0.2rem 0.35rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  color: var(--text-muted);
}

.edit-subtask-btn:hover {
  background: var(--bg-muted);
  color: var(--color-primary);
}

.subtask-row.is-editing-subtask {
  background: #f8fafc;
  border-color: var(--color-primary);
  padding: 0.6rem 0.75rem;
}

.subtask-inline-edit-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
}

.inline-edit-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 250px;
}

.edit-sub-title {
  flex: 2;
  min-width: 120px;
  font-size: 0.8rem;
}

.edit-sub-pic {
  flex: 1.2;
  min-width: 110px;
  font-size: 0.8rem;
}

.edit-sub-date {
  flex: 1;
  min-width: 120px;
  font-size: 0.8rem;
}

.inline-edit-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-xs {
  padding: 0.25rem 0.55rem;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
}

.subtask-done {
  background: #f8fafc;
  opacity: 0.75;
}

.subtask-done .subtask-title-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-main);
  flex: 1;
  min-width: 0;
}

.delete-subtask-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: var(--text-muted);
  cursor: pointer;
}
.delete-subtask-btn:hover {
  color: var(--color-danger);
}

/* Attachments & Links styles */
.attachment-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
}

.upload-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-input-native {
  display: none;
}

.selected-filename {
  font-size: 0.8125rem;
  color: var(--text-muted);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files-list, .links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment-item, .link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.att-info, .link-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.file-icon, .link-icon {
  font-size: 1.25rem;
}

.att-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.att-meta {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.att-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.delete-icon-btn:hover {
  color: var(--color-danger);
}

.link-form {
  display: flex;
  gap: 0.5rem;
}

.link-url-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
}

.link-raw {
  font-size: 0.7rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

/* Timeline Approvals */
.approval-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-left: 1.5rem;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 1rem;
}

.timeline-badge {
  position: absolute;
  left: -1.5rem;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.badge-timeline-success {
  background: var(--color-success);
}
.badge-timeline-danger {
  background: var(--color-danger);
}
.badge-timeline-warning {
  background: var(--color-warning);
}

.timeline-content {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  width: 100%;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.gate-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary);
}

.timeline-date {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.timeline-body {
  font-size: 0.8125rem;
  color: var(--text-main);
}

.text-success { color: var(--color-success); font-weight: 600; }
.text-danger { color: var(--color-danger); font-weight: 600; }
.text-warning { color: var(--color-warning); font-weight: 600; }

.timeline-notes {
  margin-top: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: #475569;
  font-style: italic;
  border-left: 3px solid var(--border-color);
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: #fafafa;
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}

.action-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-info {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.done-text {
  color: var(--color-success);
  font-weight: 600;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.footer-btn-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

/* Notes Modal Prompt */
.notes-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 60;
  border-radius: var(--radius-lg);
}

.notes-modal-box {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius-md);
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notes-modal-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.notes-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.modal-id-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  font-weight: 800;
}

.title-task-id {
  color: var(--color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.15rem;
  margin-right: 0.35rem;
}

/* Comments & Discussion */
.comment-input-card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.comment-form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.user-avatar-mini {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name-tag {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-color);
}

.comment-textarea {
  width: 100%;
  resize: vertical;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
}

.comment-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s ease;
}

.comment-card:hover {
  border-color: #cbd5e1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.avatar-circle-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: white;
}

.avatar-circle-xs {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6875rem;
  color: white;
}

.role-admin {
  background: #ef4444;
}

.role-head_of_department {
  background: #3b82f6;
}

.role-member {
  background: #10b981;
}

.comment-author-name {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.role-pill {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-weight: 600;
}

.pill-admin {
  background: #fee2e2;
  color: #b91c1c;
}

.pill-head_of_department {
  background: #dbeafe;
  color: #1d4ed8;
}

.pill-member {
  background: #d1fae5;
  color: #047857;
}

.comment-time {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reply {
  background: none;
  border: 1px solid #e2e8f0;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.btn-reply:hover {
  background: rgba(37, 99, 235, 0.08);
  border-color: var(--color-primary);
}

.btn-delete-comment {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  font-size: 0.8rem;
  padding: 0.2rem;
  border-radius: var(--radius-sm);
  transition: opacity 0.15s ease;
}

.btn-delete-comment:hover {
  opacity: 1;
}

.comment-body {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Replies (Nested) */
.replies-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1.75rem;
  padding-left: 1rem;
  border-left: 2px solid #e2e8f0;
}

.reply-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}

.reply-input-card {
  margin-left: 1.75rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-md);
}

.reply-prompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.btn-cancel-reply {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.75rem;
}

.reply-textarea {
  width: 100%;
  resize: vertical;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.6rem;
}

.reply-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
