import {
  createMemoryHistory,
  createRouter,
  createWebHistory
} from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { readAuthSnapshot } from '@/stores/auth-storage';

interface RouteMetaFlags {
  requiresAuth?: boolean;
  publicOnly?: boolean;
  requiresAdmin?: boolean;
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/LoginPage.vue'),
    meta: {
      publicOnly: true
    } satisfies RouteMetaFlags
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/pages/forbidden/ForbiddenPage.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/InternalShellLayout.vue'),
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: {
          requiresAuth: true
        } satisfies RouteMetaFlags
      },
      {
        path: '/system/organization',
        name: 'organization',
        component: () =>
          import('@/pages/organization/OrganizationManagementPage.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true
        } satisfies RouteMetaFlags
      }
    ]
  }
];

export function createAppRouter() {
  const router = createRouter({
    history:
      import.meta.env.MODE === 'test'
        ? createMemoryHistory()
        : createWebHistory(),
    routes
  });

  router.beforeEach((to) => {
    const authSnapshot = readAuthSnapshot();
    const isAuthenticated =
      authSnapshot !== null &&
      authSnapshot.accessToken.length > 0 &&
      authSnapshot.user.roles.length > 0;
    const isAdmin = authSnapshot?.user.roles.includes('admin') ?? false;

    if (to.meta.publicOnly === true && isAuthenticated) {
      return '/dashboard';
    }

    if (to.meta.requiresAuth === true && !isAuthenticated) {
      return '/login';
    }

    if (to.meta.requiresAdmin === true && !isAdmin) {
      return '/403';
    }

    return true;
  });

  return router;
}
