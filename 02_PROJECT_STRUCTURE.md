# 02 - Frontend Project Structure (Vue 3 Modern Standard)

Struktur proyek frontend disusun menggunakan arsitektur modern Vue 3 berbasis fitur dan domain:

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── api/                      # Layer komunikasi HTTP Axios
│   │   ├── axios-client.js       # Instance Axios dengan interceptor token & error
│   │   ├── auth-api.js           # Endpoint autentikasi & profil
│   │   ├── user-api.js           # Endpoint kelola pengguna (Admin)
│   │   ├── team-api.js           # Endpoint kelola anggota departemen (Kadep)
│   │   ├── task-api.js           # Endpoint CRUD tugas & status
│   │   ├── approval-api.js       # Endpoint approval gate 1 & gate 2
│   │   ├── subtask-api.js        # Endpoint kelola checklist subtask
│   │   ├── attachment-api.js     # Endpoint upload berkas & link eksternal
│   │   └── dashboard-api.js      # Endpoint agregasi metrik departemen
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── main.css          # Variabel CSS tema, reset, dan utility classes
│   │   │   └── transitions.css   # Animasi transisi halaman & dialog modal
│   │   └── images/
│   ├── components/               # Komponen UI modular
│   │   ├── common/               # Komponen dasar (Atom/Molecule)
│   │   │   ├── AppButton.vue     # Tombol dengan varian & loading spinner
│   │   │   ├── AppInput.vue      # Input teks dengan penanganan error validasi
│   │   │   ├── AppModal.vue      # Dialog modal aksesibel (WAI-ARIA)
│   │   │   ├── AppBadge.vue      # Label status & prioritas (warna tematik)
│   │   │   └── ToastNotification.vue # Notifikasi pop-up sukses/error
│   │   ├── dashboard/            # Komponen dasbor departemen
│   │   │   ├── KpiCard.vue       # Kartu metrik (Total, Pending, Overdue)
│   │   │   ├── WorkloadChart.vue # Visualisasi beban kerja anggota tim
│   │   │   └── ApprovalQueue.vue # Widget daftar tugas butuh approval Kadep
│   │   ├── task/                 # Komponen manajemen tugas
│   │   │   ├── TaskKanban.vue    # Papan kanban kolom status (drag-and-drop)
│   │   │   ├── TaskTable.vue     # Tampilan tabel daftar tugas dengan filter
│   │   │   ├── TaskCard.vue      # Kartu ringkasan tugas pada kanban
│   │   │   ├── TaskDetailModal.vue # Modal detail komprehensif tugas
│   │   │   ├── TaskFormModal.vue # Modal form pembuatan / pengeditan tugas
│   │   │   ├── SubtaskList.vue   # Checklist subtask dengan progress bar
│   │   │   └── AttachmentList.vue # Daftar file unduhan & tautan eksternal
│   │   └── approval/             # Komponen persetujuan Kadep
│   │       ├── CreationApprovalModal.vue   # Modal review usulan tugas baru
│   │       └── CompletionApprovalModal.vue # Modal review hasil kerja & verifikasi selesai
│   ├── composables/              # Logika bisnis yang dapat digunakan kembali
│   │   ├── useAuth.js            # Fungsi login, logout, cek hak akses
│   │   ├── useTasks.js           # Fungsi fetch, filter, sort tugas
│   │   ├── useApprovals.js       # Fungsi trigger approve/reject/revisi
│   │   └── useToast.js           # Fungsi pemicu notifikasi
│   ├── layouts/                  # Kerangka tata letak halaman
│   │   ├── AuthLayout.vue        # Layout halaman login & ganti sandi
│   │   ├── AppLayout.vue         # Layout aplikasi utama (Sidebar, Header, Konten)
│   │   └── TopNavbar.vue         # Navigasi atas (Profil, Notifikasi, Logout)
│   ├── router/
│   │   ├── index.js              # Definisi rute aplikasi
│   │   └── guards.js             # Middleware pelindung rute berbasis peran (RBAC)
│   ├── stores/                   # State management Pinia
│   │   ├── auth.js               # State user sesi, token, role
│   │   ├── task.js               # State daftar tugas & filter aktif
│   │   ├── team.js               # State daftar anggota departemen
│   │   └── dashboard.js          # State ringkasan KPI & antrean approval
│   ├── views/                    # Tampilan halaman utama
│   │   ├── auth/
│   │   │   ├── LoginView.vue     # Halaman login pengguna
│   │   │   └── ResetPasswordView.vue # Halaman ganti sandi
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue # Dasbor utama departemen
│   │   ├── tasks/
│   │   │   └── TaskListView.vue  # Halaman manajemen tugas (Kanban/Tabel)
│   │   ├── team/
│   │   │   └── TeamManageView.vue # Halaman kelola anggota tim (Kadep only)
│   │   ├── admin/
│   │   │   ├── UserManageView.vue # Halaman kelola pengguna sistem (Admin only)
│   │   │   └── AuditLogsView.vue  # Halaman inspeksi log audit (Admin only)
│   │   └── error/
│   │       ├── NotFoundView.vue  # Halaman 404
│   │       └── ForbiddenView.vue # Halaman 403 Akses Ditolak
│   ├── App.vue                   # Root Vue component
│   └── main.js                   # Entrypoint aplikasi (mount Pinia & Router)
├── index.html                    # File HTML utama dengan viewport responsif
├── package.json                  # Dependensi Vite, Vue 3, Pinia, Vue Router
└── vite.config.js                # Konfigurasi bundler Vite & path alias (@/ -> src/)
```
