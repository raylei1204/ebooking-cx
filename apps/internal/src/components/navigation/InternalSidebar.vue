<script setup lang="ts">
import {
  ArrowLeftBold,
  ArrowRightBold,
  HomeFilled,
  OfficeBuilding,
  Setting
} from '@element-plus/icons-vue';
import type { Component } from 'vue';

defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

interface NavigationItem {
  index: string;
  label: string;
  icon: Component;
}

const rootItems: NavigationItem[] = [
  {
    index: '/dashboard',
    label: 'Dashboard',
    icon: HomeFilled
  }
];

const systemItems: NavigationItem[] = [
  {
    index: '/system/organization',
    label: 'Organization',
    icon: OfficeBuilding
  }
];
</script>

<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--collapsed': collapsed }">
    <div class="app-sidebar__brand">
      <span class="app-sidebar__brand-mark">ARC</span>
      <span v-if="!collapsed" class="app-sidebar__brand-text">
        ARC Global Logistics
      </span>
    </div>

    <el-menu
      class="app-sidebar__menu"
      :default-active="$route.path"
      :collapse="collapsed"
      :router="true"
    >
      <el-menu-item
        v-for="item in rootItems"
        :key="item.index"
        :index="item.index"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>

      <el-sub-menu index="system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>System management</span>
        </template>

        <el-menu-item
          v-for="item in systemItems"
          :key="item.index"
          :index="item.index"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>

    <button type="button" class="app-sidebar__toggle" @click="emit('toggle')">
      <el-icon v-if="collapsed"><arrow-right-bold /></el-icon>
      <el-icon v-else><arrow-left-bold /></el-icon>
    </button>
  </aside>
</template>
