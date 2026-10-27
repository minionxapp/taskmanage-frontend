# 03 - Frontend UI/UX Guidelines and Component Specifications

| Metadata | Keterangan |
| :--- | :--- |
| **Gaya Desain** | Clean Enterprise Dashboard, Glassmorphism halus, Kontras Tinggi |
| **Prinsip Aksesibilitas** | W3C WCAG 2.1 Level AA (Kepatuhan Audit) |
| **Tipografi** | Inter / System Sans-serif |

---

## 1. Spesifikasi Komponen Dasbor Departemen

### 1.1 Kartu Metrik KPI (`KpiCard.vue`)
- **Total Tugas Aktif**: Menghitung tugas berstatus `TODO` dan `IN_PROGRESS`.
- **Menunggu Persetujuan Pembuatan (Gate 1)**: Ditandai dengan warna peringatan (Amber/Kuning). Menampilkan jumlah usulan baru dari bawahan.
- **Menunggu Verifikasi Penyelesaian (Gate 2)**: Ditandai dengan warna aksen biru/oranye. Menampilkan tugas yang diajukan selesai oleh bawahan dan menunggu verifikasi Kadep.
- **Tugas Terlambat (*Overdue*)**: Ditandai dengan warna merah tegas (*Danger*). Menampilkan tugas yang melewati tenggat waktu namun belum berstatus `DONE`.

### 1.2 Widget Antrean Approval Kadep (`ApprovalQueue.vue`)
- Khusus tampil di bagian atas dasbor ketika pengguna login sebagai Kepala Departemen.
- Berisi tab:
  1. *Usulan Tugas Baru*: Memuat nama pengusul, judul, estimasi deadline, tombol [Setujui] dan [Tolak].
  2. *Pengajuan Selesai*: Memuat pelaksana, bukti lampiran file/link, checklist subtask yang telah selesai 100%, tombol [Sahkan Selesai] dan [Minta Revisi].

### 1.3 Bagan Distribusi Beban Kerja Tim (`WorkloadChart.vue`)
- Menampilkan grafik batang horizontal per anggota departemen:
  - Jumlah tugas dalam pengerjaan (*In Progress*).
  - Jumlah tugas antrean (*Todo*).
- Memberikan indikator visual (*warning badge*) jika seorang anggota memiliki > 5 tugas aktif secara bersamaan.

---

## 2. Spesifikasi Tampilan Tugas (Kanban & Tabel)

### 2.1 Papan Kanban (`TaskKanban.vue`)
Kolom status standar:
1. **Usulan Masuk** (`PENDING_CREATION_APPROVAL`) - Ditampilkan khusus dengan penanda *Needs Approval*.
2. **Siap Dikerjakan** (`TODO`).
3. **Sedang Dikerjakan** (`IN_PROGRESS`).
4. **Verifikasi Selesai** (`PENDING_COMPLETION_APPROVAL`) - Menunggu evaluasi Kadep.
5. **Selesai Resmi** (`DONE`).

### 2.2 Modal Rincian Tugas (`TaskDetailModal.vue`)
- **Header**: Judul tugas, status badge, tombol aksi kontekstual (berdasarkan peran pengguna).
- **Tab 1 - Deskripsi & Sub-tugas**: Deskripsi lengkap, progress bar, daftar checkbox sub-tugas (dapat dicentang langsung oleh assignee/reporter).
- **Tab 2 - Lampiran & Tautan**: Form unggah file drag-and-drop, input URL eksternal dengan pratinjau tautan.
- **Tab 3 - Jejak Persetujuan & Riwayat**: Log kronologis kapan tugas dibuat, siapa yang meng-approve gate 1, catatan revisi (jika ada), dan siapa yang mengesahkan gate 2.
