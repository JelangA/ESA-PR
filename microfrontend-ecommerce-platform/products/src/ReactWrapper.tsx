import React, { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
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
  { 
    path: '/', 
    component: ProductList,
    name: 'ProductList'
  },
  { 
    path: '/products', 
    component: ProductList,
    name: 'ProductsPage'
  },
  { 
    path: '/product/:id', 
    component: ProductDetail, 
    props: true,
    name: 'ProductDetail'
  },
  { 
    path: '/category/:category', 
    component: ProductList, 
    props: true,
    name: 'CategoryProducts'
  },
];
// Route and component validation (development only)
if (process.env.NODE_ENV === 'development') {
}
const ReactWrapper: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  useEffect(() => {
    if (ref.current && !appRef.current) {
      // Create router with memory history to isolate from browser URL
      const router = createRouter({
        history: createMemoryHistory(), // Use memory history to prevent browser URL conflicts
        routes,
      });
      const pinia = createPinia();
      appRef.current = createApp(App);
      appRef.current.use(router);
      // Provide router for injection
      appRef.current.provide('router', router);
      appRef.current.use(pinia);
      appRef.current.provide('pinia', pinia);
      appRef.current.mount(ref.current);
      // Sync with container URL
      const syncUrl = () => {
        const currentPath = window.location.pathname;
        // Safety check: Make sure router is available and ready
        if (!router) {
          console.error('❌ ReactWrapper: Router not available');
          return;
        }
        // Log router state for debugging
        if (currentPath === '/products' || currentPath === '/products/') {
          if (router.currentRoute.value.path !== '/products') {
            router.replace('/products').then(() => {
            }).catch((err) => {
              console.error('❌ ReactWrapper: Memory router update failed:', err);
            });
          } else {
          }
        } else if (currentPath.startsWith('/products/')) {
          // More robust route extraction
          let vueRoute = '/';
          try {
            if (currentPath.includes('/products/product/')) {
              const productId = currentPath.split('/products/product/')[1];
              if (productId && productId.match(/^\d+$/)) {
                vueRoute = `/product/${productId}`;
              } else {
                console.warn('⚠️ ReactWrapper: Invalid product ID format:', productId);
              }
            } else {
              // Other products routes
              vueRoute = currentPath.replace('/products', '') || '/';
            }
          } catch (error) {
            console.error('❌ ReactWrapper: Error parsing route:', error);
            vueRoute = '/'; // Safe fallback
          }
          // Update memory router to match browser URL
          if (vueRoute && typeof vueRoute === 'string' && vueRoute.startsWith('/') && vueRoute !== 'undefined') {
            if (router.currentRoute.value.path !== vueRoute) {
              router.replace(vueRoute).then(() => {
              }).catch((error) => {
                console.error('❌ ReactWrapper: Memory router sync failed:', error);
                router.replace('/').catch(() => {
                  console.error('❌ ReactWrapper: Root fallback failed');
                });
              });
            } else {
            }
          } else {
            console.error('❌ ReactWrapper: Invalid Vue route:', vueRoute);
            router.replace('/').catch(() => {
              console.error('❌ ReactWrapper: Root default failed');
            });
          }
        }
      };
      // Initial sync with longer delay to ensure app is fully mounted
      setTimeout(() => {
        // Let Vue router handle the initial route automatically
        // Map browser URL to Vue router internal state (memory history)
        const currentPath = window.location.pathname;
        let vueRoute = '/';
        try {
          if (currentPath === '/products' || currentPath === '/products/') {
            vueRoute = '/products';
          } else if (currentPath.startsWith('/products/product/')) {
            const productId = currentPath.split('/products/product/')[1];
            if (productId && productId.match(/^\d+$/)) {
              vueRoute = `/product/${productId}`;
            }
          } else if (currentPath.startsWith('/products/')) {
            vueRoute = currentPath.replace('/products', '') || '/';
          }
        } catch (error) {
          console.error('❌ ReactWrapper: Error mapping route:', error);
          vueRoute = '/';
        }
        // Use replace for memory history (won't affect browser URL)
        router.replace(vueRoute).then(() => {
        }).catch(error => {
          console.error('❌ ReactWrapper: Memory router update failed:', error);
          router.replace('/').catch(() => {
            console.error('❌ ReactWrapper: Even fallback failed');
          });
        });
      }, 300);
      // Listen to browser navigation
      window.addEventListener('popstate', syncUrl);
      return () => {
        window.removeEventListener('popstate', syncUrl);
        if (appRef.current) {
          appRef.current.unmount();
          appRef.current = null;
        }
      };
    }
    return () => {
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
    };
  }, []);
  return <div ref={ref} />;
};
export default ReactWrapper;
