import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createApp } from 'vue';

import App from './App.vue';
import { createAppRouter } from './router';
import { useAuthStore } from './stores/auth';
import './styles/main.css';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

const authStore = useAuthStore(pinia);
authStore.initializeFromStorage();

app.mount('#app');
