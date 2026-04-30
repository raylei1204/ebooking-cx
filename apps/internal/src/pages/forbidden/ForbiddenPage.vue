<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

async function goToDashboard(): Promise<void> {
  await router.push('/dashboard');
}
</script>

<template>
  <div class="standalone-page">
    <el-card class="standalone-page__card">
      <el-result
        icon="warning"
        title="403"
        sub-title="You do not have access to this page."
      >
        <template #extra>
          <el-button type="primary" @click="goToDashboard">
            Return to dashboard
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>
