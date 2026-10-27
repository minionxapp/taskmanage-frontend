import axiosClient from "./axios-client.js";

export const taskApi = {
  listTasks: (params) => axiosClient.get("/tasks", { params }),
  getTaskById: (id) => axiosClient.get(`/tasks/${id}`),
  createTask: (data) => axiosClient.post("/tasks", data),
  updateTask: (id, data) => axiosClient.patch(`/tasks/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),
  deleteTask: (id) => axiosClient.delete(`/tasks/${id}`),

  // Two-Gate Approval
  approveCreation: (id, decision, notes) =>
    axiosClient.post(`/tasks/${id}/approve-creation`, { decision, notes }),
  requestCompletion: (id) => axiosClient.post(`/tasks/${id}/request-completion`),
  approveCompletion: (id, decision, notes) =>
    axiosClient.post(`/tasks/${id}/approve-completion`, { decision, notes }),
  getApprovals: (id) => axiosClient.get(`/tasks/${id}/approvals`),

  // Subtasks
  createSubtask: (taskId, data) => {
    const payload = typeof data === "string" ? { title: data } : data;
    return axiosClient.post(`/tasks/${taskId}/subtasks`, payload);
  },
  updateSubtask: (taskId, subtaskId, data) =>
    axiosClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  deleteSubtask: (taskId, subtaskId) =>
    axiosClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),

  // Attachments & Links
  uploadAttachment: (taskId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteAttachment: (attachmentId) => axiosClient.delete(`/attachments/${attachmentId}`),
  downloadAttachment: (attachmentId) =>
    axiosClient.get(`/attachments/${attachmentId}/download`, { responseType: "blob" }),
  addLink: (taskId, title, url) => axiosClient.post(`/tasks/${taskId}/links`, { title, url }),
  deleteLink: (linkId) => axiosClient.delete(`/links/${linkId}`),

  // Comments & Replies
  listComments: (taskId) => axiosClient.get(`/tasks/${taskId}/comments`),
  createComment: (taskId, content, parentId = null) =>
    axiosClient.post(`/tasks/${taskId}/comments`, { content, parent_id: parentId }),
  deleteComment: (taskId, commentId) =>
    axiosClient.delete(`/tasks/${taskId}/comments/${commentId}`),
};
