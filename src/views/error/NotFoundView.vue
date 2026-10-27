<template>
  <div class="error-page">
    <div class="card error-card">
      <div class="error-icon">🧭</div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Halaman Tidak Ditemukan</h2>
      <p class="error-desc">
        Halaman yang Anda cari tidak tersedia atau tautan yang Anda tuju telah dipindahkan.
      </p>
      <div class="error-actions">
        <router-link to="/dashboard" class="btn btn-primary">
          Kembali ke Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-card {
  max-width: 480px;
  text-align: center;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 3.5rem;
}

.error-code {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.error-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.error-actions {
  margin-top: 1rem;
}
</style>
