# Dokumentasi Komunikasi Antar-Services Menggunakan RxJS

## Gambaran Umum

Platform ini menggunakan **RxJS BehaviorSubject** sebagai mekanisme komunikasi reaktif antar-microfrontend. Pola ini memungkinkan semua service (Container, Products/Vue, Cart/React, Auth/React) berbagi state secara real-time tanpa coupling langsung antar-service.

---

## Arsitektur Komunikasi

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED LIBRARY                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              GlobalStore (Singleton)                     │   │
│  │                                                          │   │
│  │   BehaviorSubject<GlobalState>                           │   │
│  │   ┌──────────────────────────────────────────────────┐   │   │
│  │   │  GlobalState {                                    │   │   │
│  │   │    cart: CartItem[]        ← shared cart state   │   │   │
│  │   │    user: User | null       ← shared auth state   │   │   │
│  │   │    products: Product[]     ← shared product data │   │   │
│  │   │    loading: boolean                              │   │   │
│  │   │    error: string | null                          │   │   │
│  │   │  }                                               │   │   │
│  │   └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ▲ dispatch()          │ subscribe() / select()
         │                     ▼
┌────────┴──────┐   ┌──────────────────┐   ┌──────────────────┐
│  Container    │   │  Products (Vue)   │   │  Cart (React)    │
│  (React)      │   │                  │   │                  │
│               │   │  useRxJSStore.ts │   │  useRxJSStore.ts │
│  useRxJSStore │   │  (Vue Composable)│   │  (React Hook)    │
│  .ts          │   │                  │   │                  │
│               │   │  addToCart() ────┼───┼→ BehaviorSubject │
│  Header shows │   │  updateQty() ────┼───┼→ emits new state │
│  cart count   │   │                  │   │                  │
└───────────────┘   └──────────────────┘   └──────────────────┘
         │                                          │
         └──────────── window.__GLOBAL_STORE__ ─────┘
                       (untuk Auth microfrontend)
```

---

## Tahapan Komunikasi: Step-by-Step

### TAHAP 1 — Inisialisasi GlobalStore (Singleton)

**File:** `shared/src/store/GlobalStore.ts`

```typescript
// ① BehaviorSubject dibuat dengan initial state
// BehaviorSubject menyimpan nilai terakhir dan langsung emit ke subscriber baru
private state$ = new BehaviorSubject<GlobalState>(initialState);

// ② Singleton pattern — satu instance untuk seluruh aplikasi
public static getInstance(): GlobalStore {
  if (!GlobalStore.instance) {
    GlobalStore.instance = new GlobalStore();
  }
  return GlobalStore.instance;
}

// ③ Saat konstruktor dipanggil, state dipulihkan dari localStorage
protected constructor() {
  this.loadFromStorage();       // ← baca cart & user dari localStorage
  this.setupStoragePersistence(); // ← auto-save setiap state berubah
}

// ④ Export singleton langsung — semua service import instance yang sama
export const globalStore = GlobalStore.getInstance();
```

**Kenapa BehaviorSubject?**
- Menyimpan nilai terakhir (current state) — subscriber baru langsung dapat state terkini
- Bisa di-`.next()` untuk emit state baru
- Bisa dikonversi ke Observable biasa via `.asObservable()`

---

### TAHAP 2 — Container Mengekspos Store ke Window

**File:** `container/src/context/AppContextRxJS.tsx`

```typescript
// ⑤ Container adalah entry point — dia expose globalStore ke window
// Ini diperlukan karena Auth microfrontend tidak bisa import shared langsung
useEffect(() => {
  window.__GLOBAL_STORE__ = globalStore;
  // Sekarang semua microfrontend bisa akses store via window.__GLOBAL_STORE__
}, []);
```

> **Catatan:** Products dan Cart mengimport `globalStore` langsung dari `@microfrontend-ecommerce/shared` karena dikonfigurasi sebagai `singleton: true` di Webpack Module Federation. Auth menggunakan `window.__GLOBAL_STORE__` sebagai fallback.

---

### TAHAP 3 — Subscribe ke State (Membaca Data)

Setiap framework punya cara berbeda untuk subscribe ke RxJS Observable:

#### React Hook (Container & Cart)
**File:** `container/src/hooks/useRxJSStore.ts` | `cart/src/hooks/useRxJSStore.ts`

```typescript
// ⑥ Hook generik untuk subscribe ke seluruh state
export const useGlobalStore = () => {
  const [state, setState] = useState<GlobalState>(globalStore.getState());

  useEffect(() => {
    // subscribe() mengembalikan fungsi unsubscribe
    const unsubscribe = globalStore.subscribe(setState);
    return unsubscribe; // cleanup saat komponen unmount
  }, []);

  return { state };
};

// ⑦ Hook untuk subscribe ke slice tertentu (lebih efisien)
// Menggunakan select() yang sudah pakai distinctUntilChanged()
// → hanya re-render jika nilai slice itu berubah
export const useGlobalSelector = <K extends keyof GlobalState>(key: K) => {
  const [value, setValue] = useState(globalStore.getState()[key]);

  useEffect(() => {
    // globalStore.select(key) menggunakan:
    // state$.pipe(map(state => state[key]), distinctUntilChanged())
    const subscription = globalStore.select(key).subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [key]);

  return value;
};
```

#### Vue Composable (Products)
**File:** `products/src/composables/useRxJSStore.ts`

```typescript
// ⑧ Vue composable menggunakan ref() + onMounted/onUnmounted lifecycle
export const useGlobalStore = () => {
  const state = ref<GlobalState>(globalStore.getState());
  let subscription: any = null;

  onMounted(() => {
    // Subscribe saat komponen mount
    subscription = globalStore.subscribe((newState: GlobalState) => {
      state.value = newState; // Vue reactive ref auto-trigger re-render
    });
  });

  onUnmounted(() => {
    if (subscription) subscription(); // cleanup
  });

  return { state: computed(() => state.value) };
};

// ⑨ Cart composable menggunakan computed() untuk derived state
export const useCart = () => {
  const { state } = useGlobalStore();

  // computed() di Vue = otomatis reaktif terhadap perubahan state
  const cart = computed(() => state.value.cart);
  const isInCart = (productId: number) =>
    computed(() => cart.value.some(item => item.productId === productId));
  const getProductQuantity = (productId: number) =>
    computed(() => cart.value.find(item => item.productId === productId)?.quantity ?? 0);

  return { cart, isInCart, getProductQuantity };
};
```

#### Auth (React via window)
**File:** `auth/src/hooks/useRxJSStore.ts`

```typescript
// ⑩ Auth mengakses store via window karena bisa jalan standalone
export const useAuthRxJS = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const globalStore = window.__GLOBAL_STORE__;
    if (!globalStore) return; // graceful fallback jika standalone

    // Subscribe langsung ke BehaviorSubject internal
    const subscription = globalStore.state$.subscribe((state: any) => {
      setUser(state.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAuthenticated: !!user, user };
};
```

---

### TAHAP 4 — Dispatch Action (Menulis Data)

**File:** `shared/src/store/GlobalStore.ts`

```typescript
// ⑪ Dispatch action → reducer → BehaviorSubject.next()
dispatch(action: GlobalAction): void {
  const currentState = this.state$.value;      // baca state saat ini
  const newState = globalReducer(currentState, action); // hitung state baru
  this.state$.next(newState);                  // emit ke semua subscriber
}

// ⑫ Convenience methods (wrapper dispatch)
addToCart(product: Product, quantity: number = 1): void {
  // Pastikan product ada di products array dulu
  const currentState = this.getState();
  if (!currentState.products.find(p => p.id === product.id)) {
    this.setProducts([...currentState.products, product]);
  }
  this.dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
}
```

---

### TAHAP 5 — Alur Lengkap: User Klik "Add to Cart" di Products (Vue)

```
User klik tombol "Add to Cart" di ProductCard.vue
         │
         ▼
[ProductCard.vue] addToCart()
  → addToRxJSCart(props.product, 1)   ← dari useCart() composable
         │
         ▼
[useRxJSStore.ts - Vue] addToCart(product, quantity)
  → globalStore.setProducts([...currentProducts, product])  // simpan product
  → globalStore.addToCart(product, quantity)                 // tambah ke cart
         │
         ▼
[GlobalStore.ts] addToCart()
  → dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } })
         │
         ▼
[GlobalStore.ts] dispatch()
  → globalReducer(currentState, action)  // hitung state baru
  → state$.next(newState)                // BehaviorSubject emit!
         │
         ├──────────────────────────────────────────────────────┐
         ▼                                                      ▼
[Container - useGlobalSelector('cart')]              [Cart - useGlobalSelector('cart')]
  setState(newState.cart)                              setState(newState.cart)
  → Header re-render                                   → CartContent re-render
  → cartCount badge update ✓                           → item list update ✓
         │
         ▼
[GlobalStore.ts] setupStoragePersistence()
  → localStorage.setItem('microfrontend-global-state', ...)  // auto-persist ✓
```

---

### TAHAP 6 — Reducer: Logika State Transition

**File:** `shared/src/store/GlobalStore.ts`

```typescript
// ⑬ Pure reducer function — tidak ada side effect
const globalReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingIndex = state.cart.findIndex(
        item => item.productId === action.payload.product.id
      );

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        // Update quantity jika sudah ada
        newCart = state.cart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Tambah item baru
        newCart = [...state.cart, {
          productId: action.payload.product.id,
          quantity: action.payload.quantity,
        }];
      }
      return { ...state, cart: newCart }; // immutable update
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.productId !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart
          .map(item => item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
          )
          .filter(item => item.quantity > 0), // hapus jika qty = 0
      };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    default:
      return state;
  }
};
```

---

### TAHAP 7 — Persistensi Otomatis ke localStorage

**File:** `shared/src/store/GlobalStore.ts`

```typescript
// ⑭ Setiap kali state berubah, otomatis disimpan ke localStorage
private setupStoragePersistence(): void {
  this.state$.subscribe((state) => {
    // Hanya simpan data penting (bukan loading/error yang transient)
    const persistentState = {
      cart: state.cart,
      user: state.user,
    };
    localStorage.setItem('microfrontend-global-state', JSON.stringify(persistentState));

    // Kompatibilitas dengan format lama (auth app)
    if (state.user) {
      localStorage.setItem('authUser', JSON.stringify(state.user));
      localStorage.setItem('authToken', 'dummy-token');
    } else {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
  });
}
```

---

## Ringkasan Operator RxJS yang Digunakan

| Operator/Class | Digunakan Di | Fungsi |
|---|---|---|
| `BehaviorSubject` | `GlobalStore` | Menyimpan & emit state terkini |
| `Observable` | `GlobalStore.getState$()` | Stream state yang bisa di-subscribe |
| `map` | `GlobalStore.select()` | Mengambil slice tertentu dari state |
| `distinctUntilChanged` | `GlobalStore.select()` | Mencegah emit jika nilai tidak berubah |
| `.subscribe()` | Semua hooks/composables | Mendengarkan perubahan state |
| `.next()` | `GlobalStore.dispatch()` | Emit state baru ke semua subscriber |
| `.asObservable()` | `GlobalStore.getState$()` | Expose stream tanpa kemampuan emit |
| `.unsubscribe()` | Cleanup di hooks | Mencegah memory leak |

---

## Diagram Alur Data Lengkap

```
                    ┌─────────────────────────────┐
                    │      localStorage            │
                    │  microfrontend-global-state  │
                    │  { cart: [], user: null }    │
                    └──────────┬──────────────────┘
                               │ loadFromStorage()
                               ▼
                    ┌─────────────────────────────┐
                    │  BehaviorSubject<GlobalState>│
                    │  (initial state loaded)      │
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
  ┌───────────────┐   ┌────────────────┐   ┌───────────────┐
  │ Container     │   │ Products (Vue) │   │ Cart (React)  │
  │ useRxJSStore  │   │ useRxJSStore   │   │ useRxJSStore  │
  │               │   │ (composable)   │   │               │
  │ subscribe ────┼───┼──────────────  │   │ subscribe ────┤
  │               │   │                │   │               │
  │ Header:       │   │ ProductCard:   │   │ CartContent:  │
  │ cartCount ✓   │   │ isInCart ✓     │   │ items list ✓  │
  │ userName ✓    │   │ quantity ✓     │   │ total ✓       │
  └───────┬───────┘   └───────┬────────┘   └───────┬───────┘
          │                   │                    │
          │           dispatch/addToCart()          │
          │                   │                    │
          └───────────────────▼────────────────────┘
                    ┌─────────────────────────────┐
                    │  globalReducer()             │
                    │  → immutable state update    │
                    │  → state$.next(newState)     │
                    └──────────┬──────────────────┘
                               │ emit ke semua subscriber
                               ▼
                    ┌─────────────────────────────┐
                    │  All subscribers notified    │
                    │  → React: setState()         │
                    │  → Vue: ref.value = newState │
                    │  → localStorage auto-saved   │
                    └─────────────────────────────┘
```

---

## Keunggulan Pola Ini

1. **Framework-agnostic** — RxJS bekerja di React (hooks), Vue (composables), maupun vanilla JS
2. **Single source of truth** — satu BehaviorSubject untuk semua state
3. **Reactive** — perubahan state otomatis propagate ke semua subscriber
4. **Persistent** — state otomatis disimpan ke localStorage
5. **Type-safe** — semua action dan state didefinisikan dengan TypeScript
6. **Memory-safe** — setiap subscriber cleanup via `unsubscribe()` di lifecycle hooks
