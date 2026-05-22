import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';
import ProductList from './components/ProductList.vue';
import ProductDetail from './components/ProductDetail.vue';
import './style.css';

// Module Federation type declaration
declare global {
  interface Window {
    __POWERED_BY_MODULE_FEDERATION__?: boolean;
  }
}

const routes = [
  { path: '/', component: ProductList },
  { path: '/product/:id', component: ProductDetail, props: true },
  { path: '/category/:category', component: ProductList, props: true },
];

const router = createRouter({
  history: createWebHistory('/products'),
  routes,
});

const pinia = createPinia();

// Mount the app only if running standalone
if (!window.__POWERED_BY_MODULE_FEDERATION__) {
  const app = createApp(App);
  app.use(router);
  app.use(pinia);
  app.mount('#products-app');
}

export default App;
