<script setup lang="ts">
import { ArrowDown, SwitchButton, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import InternalSidebar from '@/components/navigation/InternalSidebar.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const collapsed = ref(false);

const userDisplayName = computed(() => authStore.currentUser?.name ?? 'User');
const userEmail = computed(() => authStore.currentUser?.email ?? '');

async function handleLogout(): Promise<void> {
  await authStore.logout();
  ElMessage.success('Signed out.');
  await router.push('/login');
}
</script>

<template>
  <div class="app-shell">
    <InternalSidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

    <div class="app-shell__main">
      <header class="app-shell__header">
        <div class="app-shell__header-brand">ARC Global Logistics</div>

        <div class="app-shell__header-actions">
          <el-dropdown trigger="click">
            <button type="button" class="app-shell__user-button">
              <el-icon><user-filled /></el-icon>
              <span>{{ userDisplayName }}</span>
              <el-icon><arrow-down /></el-icon>
            </button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  {{ userEmail }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><switch-button /></el-icon>
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="app-shell__content">
        <router-view />
      </main>
    </div>
  </div>
</template>
