<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, inject, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { authLoginKey } from './auth-login';
import { useAuthStore } from '@/stores/auth';

interface LoginFormModel {
  email: string;
  password: string;
}

const router = useRouter();
const authStore = useAuthStore();
const injectedLogin = inject(authLoginKey, null);

const formModel = reactive<LoginFormModel>({
  email: '',
  password: ''
});

const loginError = computed(() => authStore.loginError);

async function handleSubmit(): Promise<void> {
  try {
    await (injectedLogin ?? authStore.login)({
      email: formModel.email,
      password: formModel.password
    });

    await router.push('/dashboard');
  } catch {
    if (authStore.loginError === null) {
      ElMessage.error('Unable to sign in right now.');
    }
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__panel">
      <div class="login-page__brand-bar">
        <div class="login-page__brand-text">ARC Global Logistics</div>
      </div>

      <div class="login-page__body">
        <h1 class="page-title">Login</h1>

        <el-form
          label-position="top"
          class="login-form"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="EMAIL ADDRESS">
            <el-input
              v-model="formModel.email"
              type="text"
              autocomplete="username"
              placeholder="admin@example.com"
            />
          </el-form-item>

          <el-form-item label="PASSWORD">
            <el-input
              v-model="formModel.password"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="Enter your password"
            />
          </el-form-item>

          <div class="login-page__forgot-row">
            <a href="#" class="login-page__forgot-link"
              >Forgot your password?</a
            >
          </div>

          <p v-if="loginError !== null" class="login-page__inline-error">
            {{ loginError }}
          </p>

          <el-button
            native-type="submit"
            type="primary"
            class="login-page__primary-button"
            :loading="authStore.isLoggingIn"
            :disabled="authStore.isLoggingIn"
          >
            Login
          </el-button>

          <div class="login-page__divider">
            <span>OR</span>
          </div>

          <el-tooltip content="Contact your administrator">
            <span class="login-page__signup-wrapper">
              <el-button
                data-testid="signup-button"
                class="login-page__secondary-button"
                :disabled="true"
              >
                Sign up
              </el-button>
            </span>
          </el-tooltip>
        </el-form>
      </div>
    </div>

    <footer class="login-page__footer">
      Copyright © {{ new Date().getFullYear() }} ARC Global Logistics. All
      rights reserved.
    </footer>
  </div>
</template>
