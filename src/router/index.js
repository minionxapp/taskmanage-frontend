import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/dashboard/DashboardView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tasks",
    name: "Tasks",
    component: () => import("../views/tasks/TaskListView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/team",
    name: "TeamManage",
    component: () => import("../views/team/TeamManageView.vue"),
    meta: { requiresAuth: true, roles: ["HEAD_OF_DEPARTMENT", "ADMIN"] },
  },
  {
    path: "/admin/departments",
    name: "DepartmentManage",
    component: () => import("../views/admin/DepartmentManageView.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/admin/users",
    name: "UserManage",
    component: () => import("../views/admin/UserManageView.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/admin/audit-logs",
    name: "AuditLogs",
    component: () => import("../views/admin/AuditLogsView.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/forbidden",
    name: "Forbidden",
    component: () => import("../views/error/ForbiddenView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/error/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem("tm_access_token");
  const user = JSON.parse(localStorage.getItem("tm_user") || "null");

  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next({ name: "Login", query: { redirect: to.fullPath } });
    }

    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      return next({ name: "Forbidden" });
    }
  }

  if (to.meta.requiresGuest && token && user) {
    return next({ name: "Dashboard" });
  }

  next();
});

export default router;
