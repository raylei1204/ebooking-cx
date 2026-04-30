import ElementPlus from 'element-plus';
import { createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoginPage from './LoginPage.vue';
import { authLoginKey } from './auth-login';

describe('LoginPage', () => {
  it('submits the login form and disables the secondary sign-up action', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/login',
          component: LoginPage
        },
        {
          path: '/dashboard',
          component: {
            template: '<div>Dashboard</div>'
          }
        }
      ]
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), ElementPlus, router],
        provide: {
          [authLoginKey as symbol]: login
        }
      }
    });

    await wrapper.get('input[type="text"]').setValue('admin@example.com');
    await wrapper.get('input[type="password"]').setValue('Password123!');
    await wrapper.get('form').trigger('submit.prevent');

    expect(login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    expect(
      wrapper.get('[data-testid="signup-button"]').attributes('disabled')
    ).toBeDefined();
  });
});
