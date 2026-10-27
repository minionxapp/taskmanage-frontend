import axiosClient from "./axios-client.js";

export const authApi = {
  login: (credentials) => axiosClient.post("/auth/login", credentials),
  refresh: (refreshToken) => axiosClient.post("/auth/refresh", { refresh_token: refreshToken }),
  logout: () => axiosClient.post("/auth/logout"),
  getProfile: () => axiosClient.get("/users/profile"),
  updateProfile: (data) => axiosClient.patch("/users/profile", data),
  changePassword: (data) => axiosClient.post("/users/change-password", data),
};
