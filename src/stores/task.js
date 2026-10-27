import { defineStore } from "pinia";
import { ref } from "vue";
import { taskApi } from "../api/task-api.js";

export const useTaskStore = defineStore("task", () => {
  const tasks = ref([]);
  const currentTask = ref(null);
  const loading = ref(false);
  const filters = ref({
    status: "",
    priority: "",
    search: "",
  });

  const fetchTasks = async () => {
    loading.value = true;
    try {
      const params = {};
      if (filters.value.status) params.status = filters.value.status;
      if (filters.value.priority) params.priority = filters.value.priority;
      if (filters.value.search) params.search = filters.value.search;

      const res = await taskApi.listTasks(params);
      tasks.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchTaskById = async (id) => {
    loading.value = true;
    try {
      const res = await taskApi.getTaskById(id);
      currentTask.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (payload) => {
    const res = await taskApi.createTask(payload);
    await fetchTasks();
    return res.data;
  };

  const updateTask = async (id, payload) => {
    const res = await taskApi.updateTask(id, payload);
    await fetchTaskById(id);
    await fetchTasks();
    return res.data;
  };

  const updateStatus = async (id, status) => {
    const res = await taskApi.updateStatus(id, status);
    await fetchTasks();
    if (currentTask.value && currentTask.value.id === id) {
      await fetchTaskById(id);
    }
    return res.data;
  };

  const approveCreation = async (id, decision, notes) => {
    const res = await taskApi.approveCreation(id, decision, notes);
    await fetchTasks();
    return res.data;
  };

  const requestCompletion = async (id) => {
    const res = await taskApi.requestCompletion(id);
    await fetchTasks();
    if (currentTask.value && currentTask.value.id === id) {
      await fetchTaskById(id);
    }
    return res.data;
  };

  const approveCompletion = async (id, decision, notes) => {
    const res = await taskApi.approveCompletion(id, decision, notes);
    await fetchTasks();
    return res.data;
  };

  const deleteTask = async (id) => {
    const res = await taskApi.deleteTask(id);
    await fetchTasks();
    return res.data;
  };

  const listComments = async (taskId) => {
    const res = await taskApi.listComments(taskId);
    return res.data;
  };

  const createComment = async (taskId, content, parentId = null) => {
    const res = await taskApi.createComment(taskId, content, parentId);
    return res.data;
  };

  const deleteComment = async (taskId, commentId) => {
    const res = await taskApi.deleteComment(taskId, commentId);
    return res.data;
  };

  return {
    tasks,
    currentTask,
    loading,
    filters,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    updateStatus,
    approveCreation,
    requestCompletion,
    approveCompletion,
    deleteTask,
    listComments,
    createComment,
    deleteComment,
  };
});
