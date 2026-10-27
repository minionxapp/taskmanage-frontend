import axiosClient from "./axios-client.js";

export const departmentApi = {
  listDepartments: () => axiosClient.get("/departments"),
  createDepartment: (data) => axiosClient.post("/departments", data),
  updateDepartment: (id, data) => axiosClient.patch(`/departments/${id}`, data),
  deleteDepartment: (id) => axiosClient.delete(`/departments/${id}`),
};

export const teamApi = {
  listMembers: (departmentId) =>
    axiosClient.get("/teams/members", { params: departmentId ? { department_id: departmentId } : {} }),
  addMember: (userId, departmentId) => axiosClient.post("/teams/members", { user_id: userId, department_id: departmentId }),
  removeMember: (userId) => axiosClient.delete(`/teams/members/${userId}`),
};

export const userApi = {
  listUsers: () => axiosClient.get("/users"),
  createUser: (data) => axiosClient.post("/users", data),
  resetPassword: (id, newPassword) =>
    axiosClient.post(`/users/${id}/reset-password`, { new_password: newPassword }),
  updateRole: (id, role) => axiosClient.patch(`/users/${id}/role`, { role }),
  deactivateUser: (id) => axiosClient.delete(`/users/${id}`),
};

export const dashboardApi = {
  getMetrics: () => axiosClient.get("/dashboard/metrics"),
  getApprovalsQueue: () => axiosClient.get("/dashboard/approvals-queue"),
  getTeamWorkload: () => axiosClient.get("/dashboard/team-workload"),
  listAuditLogs: (limit = 50) => axiosClient.get("/audit-logs", { params: { limit } }),
};
