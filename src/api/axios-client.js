import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Sisipkan JWT Token pada setiap request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("tm_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Tangani 401 Unauthorized secara terpusat
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("tm_access_token");
      localStorage.removeItem("tm_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const message =
      error.response?.data?.errors ||
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan pada sistem";
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
