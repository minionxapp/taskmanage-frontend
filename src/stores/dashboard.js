import { defineStore } from "pinia";
import { ref } from "vue";
import { teamApi, dashboardApi } from "../api/common-api.js";

export const useTeamStore = defineStore("team", () => {
  const members = ref([]);
  const loading = ref(false);

  const fetchMembers = async (departmentId) => {
    loading.value = true;
    try {
      const res = await teamApi.listMembers(departmentId);
      members.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const addMember = async (userId, departmentId) => {
    const res = await teamApi.addMember(userId, departmentId);
    await fetchMembers();
    return res.data;
  };

  const removeMember = async (userId) => {
    const res = await teamApi.removeMember(userId);
    await fetchMembers();
    return res.data;
  };

  return {
    members,
    loading,
    fetchMembers,
    addMember,
    removeMember,
  };
});

export const useDashboardStore = defineStore("dashboard", () => {
  const metrics = ref({
    total_active: 0,
    pending_creation: 0,
    in_progress: 0,
    pending_completion: 0,
    completed: 0,
    overdue: 0,
  });
  const queue = ref({ pending_creation: [], pending_completion: [] });
  const workload = ref([]);
  const auditLogs = ref([]);
  const loading = ref(false);

  const fetchDashboardData = async (isKadep = false, isAdmin = false) => {
    loading.value = true;
    try {
      const pMetrics = dashboardApi.getMetrics();
      const pWorkload = dashboardApi.getTeamWorkload();
      const promises = [pMetrics, pWorkload];

      if (isKadep) {
        promises.push(dashboardApi.getApprovalsQueue());
      }
      if (isAdmin) {
        promises.push(dashboardApi.listAuditLogs());
      }

      const results = await Promise.all(promises);
      metrics.value = results[0].data;
      workload.value = results[1].data;

      if (isKadep && results[2]) {
        queue.value = results[2].data;
      }
      if (isAdmin) {
        const auditIndex = isKadep ? 3 : 2;
        if (results[auditIndex]) {
          auditLogs.value = results[auditIndex].data;
        }
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    metrics,
    queue,
    workload,
    auditLogs,
    loading,
    fetchDashboardData,
  };
});
