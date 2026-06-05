# Analisa Jenis Komposisi Microfrontend

## Ringkasan Eksekutif

Platform ini menggunakan **kombinasi dua jenis komposisi microfrontend** secara bersamaan:

| Jenis Komposisi | Digunakan | Keterangan |
|---|---|---|
| **Client-Side Composition** | ✅ Utama | Webpack Module Federation |
| **Run-time Integration** | ✅ Utama | Dynamic remote loading |
| **Build-time Integration** | ❌ Tidak | Tidak ada pre-bundling bersama |
| **Server-Side Composition** | ❌ Tidak | Tidak ada SSR/edge composition |
| **iFrame Composition** | ❌ Tidak | Tidak ada isolasi iframe |

**Kesimpulan:** Platform ini menggunakan **Client-Side Composition via Webpack Module Federation (Run-time Integration)** sebagai pola utama.

---

## 1. Jenis Komposisi: Client-Side Composition

### Definisi
Komposisi dilakukan di browser (client), bukan di server. Container/shell app memuat dan merakit microfrontend secara dinamis saat runtime.

### Bukti di Kode

**Container sebagai Shell App:**
```
container/src/App.tsx
  └── <AppProvider>          ← RxJS global state
      └── <Router>
          ├── /              → <Home />
          ├── /products/*    → <RemoteProductsApp />   ← remote MFE
          ├── /cart/*        → <RemoteCartApp />        ← remote MFE
          └── /auth/*        → <RemoteAuthApp />        ← remote MFE
```

**Container webpack.config.js** — Container hanya sebagai *host*, tidak bundle MFE lain:
```javascript
// Container TIDAK expose apapun, hanya consume remotes
new ModuleFederationPlugin({
  name: 'container',
  // Tidak ada 'exposes' — murni sebagai host/shell
  remotes: isProd
    ? {
        products: 'products@/products/remoteEntry.js',
        cart:     'cart@/cart/remoteEntry.js',
        auth:     'auth@/auth/remoteEntry.js',
      }
    : {
        products: 'products@http://localhost:3001/remoteEntry.js',
        cart:     'cart@http://localhost:3002/remoteEntry.js',
        auth:     'auth@http://localhost:3003/remoteEntry.js',
      },
})
```

---

## 2. Mekanisme Integrasi: Webpack Module Federation

### Apa itu Module Federation?
Module Federation adalah fitur Webpack 5 yang memungkinkan satu aplikasi JavaScript memuat modul dari aplikasi lain secara dinamis di runtime, tanpa perlu build bersama.

### Topologi Jaringan

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Runtime)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Container (Port 3000)                  │   │
│  │              HOST / SHELL APP                       │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Webpack Module Federation - CONSUMER       │   │   │
│  │  │                                             │   │   │
│  │  │  remotes: {                                 │   │   │
│  │  │    products → localhost:3001/remoteEntry.js │   │   │
│  │  │    cart     → localhost:3002/remoteEntry.js │   │   │
│  │  │    auth     → localhost:3003/remoteEntry.js │   │   │
│  │  │  }                                         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │   │
│           │ dynamic import()                            │   │
│           ▼                                             │   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │ Products MFE │  │  Cart MFE    │  │  Auth MFE    │  │   │
│  │ Port 3001    │  │  Port 3002   │  │  Port 3003   │  │   │
│  │              │  │              │  │              │  │   │
│  │ REMOTE       │  │ REMOTE       │  │ REMOTE       │  │   │
│  │ exposes:     │  │ exposes:     │  │ exposes:     │  │   │
│  │ './App'      │  │ './App'      │  │ './App'      │  │   │
│  │ (Vue+React   │  │ (React)      │  │ (React)      │  │   │
│  │  Wrapper)    │  │              │  │              │  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  │   │
└─────────────────────────────────────────────────────────────┘
```

### Konfigurasi Setiap Remote

**Products (Vue + React Wrapper) — Port 3001:**
```javascript
// products/webpack.config.js
new ModuleFederationPlugin({
  name: 'products',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/ReactWrapper.tsx',  // ← expose React wrapper yang mount Vue app
  },
  shared: {
    react: { singleton: true },
    vue: { singleton: true },
    'vue-router': { singleton: true },
    pinia: { singleton: true },
    '@microfrontend-ecommerce/shared': { singleton: true },
  },
})
```

**Cart (React) — Port 3002:**
```javascript
// cart/webpack.config.js
new ModuleFederationPlugin({
  name: 'cart',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',  // ← expose React App langsung
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    '@microfrontend-ecommerce/shared': { singleton: true },
  },
})
```

---

## 3. Pola Komposisi Khusus: Cross-Framework Composition

### Keunikan Platform Ini
Platform ini mengimplementasikan **Cross-Framework Microfrontend Composition** — menggabungkan dua framework berbeda (React dan Vue 3) dalam satu halaman.

```
Container (React 18)
    │
    ├── /products/* → RemoteProductsApp
    │                     │
    │                     └── ReactWrapper.tsx (React)
    │                              │
    │                              └── createApp(App.vue) (Vue 3)
    │                                       │
    │                                       ├── ProductList.vue
    │                                       ├── ProductCard.vue
    │                                       └── ProductDetail.vue
    │
    ├── /cart/*    → RemoteCartApp (React)
    └── /auth/*    → RemoteAuthApp (React)
```

### Implementasi ReactWrapper (Bridge Pattern)

```typescript
// products/src/ReactWrapper.tsx
// React komponen yang menjadi "jembatan" untuk mount Vue app
const ReactWrapper: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    if (ref.current && !appRef.current) {
      // ① Buat Vue Router dengan memory history
      //    (memory history agar tidak konflik dengan React Router di container)
      const router = createRouter({
        history: createMemoryHistory(),
        routes,
      });

      // ② Buat Pinia store untuk state lokal Vue
      const pinia = createPinia();

      // ③ Mount Vue app ke dalam div React
      appRef.current = createApp(App);
      appRef.current.use(router);
      appRef.current.use(pinia);
      appRef.current.mount(ref.current);

      // ④ Sinkronisasi URL browser → Vue memory router
      window.addEventListener('popstate', syncUrl);
    }

    return () => {
      // ⑤ Cleanup: unmount Vue app saat React komponen unmount
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
    };
  }, []);

  return <div ref={ref} />;  // ← Vue app di-mount ke sini
};
```

---

## 4. Pola State Management: Shared Singleton Store

### Jenis Komposisi State
Platform menggunakan **Shared State Composition** via RxJS Singleton Store yang di-share melalui Module Federation's `singleton: true`.

```
┌─────────────────────────────────────────────────────────────┐
│              @microfrontend-ecommerce/shared                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GlobalStore (Singleton)                            │   │
│  │  BehaviorSubject<GlobalState>                       │   │
│  │                                                     │   │
│  │  Dikonfigurasi sebagai singleton di semua MFE:      │   │
│  │  '@microfrontend-ecommerce/shared': {               │   │
│  │    singleton: true,   ← satu instance di browser   │   │
│  │    eager: false       ← lazy load                  │   │
│  │  }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↑ import                    ↑ import
         │                           │
┌────────┴──────┐           ┌────────┴──────┐
│ Container     │           │ Products (Vue)│
│ Cart (React)  │           │               │
│               │           │ composables/  │
│ hooks/        │           │ useRxJSStore  │
│ useRxJSStore  │           │               │
└───────────────┘           └───────────────┘
         ↑ window.__GLOBAL_STORE__
         │
┌────────┴──────┐
│ Auth (React)  │
│               │
│ hooks/        │
│ useRxJSStore  │
└───────────────┘
```

---

## 5. Pola Routing: Nested Routing Composition

### Strategi Routing

```
Browser URL          Container Router    Vue Memory Router
─────────────────    ────────────────    ─────────────────
/                 →  <Home />
/products         →  <RemoteProductsApp> → /products
/products/product/1 → <RemoteProductsApp> → /product/1
/cart             →  <RemoteCartApp>
/auth             →  <RemoteAuthApp>
```

**Container menggunakan BrowserRouter** (HTML5 History API):
```typescript
// container/src/App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/products/*" element={<RemoteProductsApp />} />
    <Route path="/cart/*"     element={<RemoteCartApp />} />
    <Route path="/auth/*"     element={<RemoteAuthApp />} />
  </Routes>
</BrowserRouter>
```

**Products Vue menggunakan MemoryHistory** (tidak mengubah URL browser):
```typescript
// products/src/ReactWrapper.tsx
const router = createRouter({
  history: createMemoryHistory(), // ← tidak konflik dengan React Router
  routes: [
    { path: '/products', component: ProductList },
    { path: '/product/:id', component: ProductDetail },
  ],
});
// Sinkronisasi manual: browser URL → Vue memory router
window.addEventListener('popstate', syncUrl);
```

---

## 6. Pola Isolasi: Error Boundary Composition

Setiap microfrontend dibungkus `ErrorBoundary` untuk isolasi kegagalan:

```typescript
// container/src/App.tsx
<ErrorBoundary microfrontendName="Products">
  <MicrofrontendWrapper>
    <RemoteProductsApp />
  </MicrofrontendWrapper>
</ErrorBoundary>
```

Jika Products MFE crash, Container dan MFE lain tetap berjalan normal.

---

## 7. Pola State Lokal vs Global

Platform menggunakan **dua lapisan state** secara bersamaan:

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                       │
│                                                             │
│  GLOBAL STATE (RxJS BehaviorSubject)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  cart, user, products, loading, error               │   │
│  │  → Dibagi antar semua microfrontend                 │   │
│  │  → Persisted ke localStorage                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  LOCAL STATE (Framework-specific)                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ Products (Pinia) │  │ Cart/Auth (React useState)   │    │
│  │                  │  │                              │    │
│  │ - products[]     │  │ - UI state (showConfirm)     │    │
│  │ - categories[]   │  │ - form state                 │    │
│  │ - selectedSort   │  │ - isSignup toggle            │    │
│  │ - filteredProds  │  │                              │    │
│  │ (UI-only state)  │  │ (UI-only state)              │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Products menggunakan Pinia** untuk state lokal (daftar produk dari API, filter, sort) karena ini adalah data yang hanya relevan untuk Products MFE. Saat user menambah ke cart, data product dikirim ke GlobalStore (RxJS) agar Cart MFE bisa menampilkan detail produk.

---

## 8. Ringkasan Arsitektur Komposisi

```
┌─────────────────────────────────────────────────────────────────┐
│              MICROFRONTEND COMPOSITION SUMMARY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JENIS KOMPOSISI:  Client-Side Composition                      │
│  MEKANISME:        Webpack Module Federation (Run-time)         │
│  TOPOLOGI:         Shell/Host + Multiple Remotes                │
│                                                                 │
│  FRAMEWORK:        React 18 (Container, Cart, Auth)             │
│                    Vue 3 (Products) via React Bridge            │
│                                                                 │
│  STATE SHARING:    RxJS BehaviorSubject Singleton               │
│                    + localStorage persistence                   │
│                                                                 │
│  ROUTING:          React Router (Container) +                   │
│                    Vue Router Memory History (Products)         │
│                                                                 │
│  ISOLASI:          ErrorBoundary per MFE                        │
│                    Standalone mode support                      │
│                                                                 │
│  DEPLOYMENT:       Independent per MFE (Vercel)                 │
│                    Static file serving per subdirectory         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  POLA DESAIN YANG DIGUNAKAN:                                    │
│  ✓ Shell/Host Pattern                                           │
│  ✓ Singleton Store Pattern (RxJS)                               │
│  ✓ Bridge Pattern (ReactWrapper untuk Vue)                      │
│  ✓ Facade Pattern (CartContextRxJS wraps useRxJSStore)          │
│  ✓ Observer Pattern (BehaviorSubject subscriptions)             │
│  ✓ Reducer Pattern (globalReducer untuk state transitions)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Trade-off dan Pertimbangan

### Kelebihan Pendekatan Ini
- **Independent deployment** — setiap MFE bisa di-deploy sendiri
- **Technology diversity** — React dan Vue bisa hidup berdampingan
- **Shared state tanpa coupling** — RxJS singleton menghindari prop drilling
- **Standalone mode** — setiap MFE bisa jalan sendiri untuk development

### Keterbatasan
- **Bundle size** — React dan Vue keduanya di-load (meski singleton)
- **Kompleksitas routing** — sinkronisasi manual URL browser ↔ Vue memory router
- **window.__GLOBAL_STORE__** — Auth bergantung pada global window object sebagai fallback
- **Pinia + RxJS** — Products menggunakan dua state management sekaligus (Pinia untuk UI state lokal, RxJS untuk shared state)
