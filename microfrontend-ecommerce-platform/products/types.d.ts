declare global {
  interface Window {
    __POWERED_BY_MODULE_FEDERATION__?: boolean;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

export {};
