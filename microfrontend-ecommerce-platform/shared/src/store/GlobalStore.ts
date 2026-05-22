import { BehaviorSubject, Observable, map, distinctUntilChanged } from "rxjs";
import { CartItem, Product, User } from "../types";

// Global state interface
export interface GlobalState {
  cart: CartItem[];
  user: User | null;
  products: Product[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: GlobalState = {
  cart: [],
  user: null,
  products: [],
  loading: false,
  error: null,
};

// Action types
export type GlobalAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_TO_CART"; payload: { product: Product; quantity: number } }
  | { type: "REMOVE_FROM_CART"; payload: number }
  | {
      type: "UPDATE_CART_QUANTITY";
      payload: { productId: number; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

// Reducer function
const globalReducer = (
  state: GlobalState,
  action: GlobalAction
): GlobalState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_USER":
      return { ...state, user: action.payload };

    case "SET_PRODUCTS":
      return { ...state, products: action.payload };

    case "ADD_TO_CART": {
      const existingIndex = state.cart.findIndex(
        (item) => item.productId === action.payload.product.id
      );

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        newCart = state.cart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newCart = [
          ...state.cart,
          {
            productId: action.payload.product.id,
            quantity: action.payload.quantity,
          },
        ];
      }

      return { ...state, cart: newCart };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.productId !== action.payload),
      };

    case "UPDATE_CART_QUANTITY":
      return {
        ...state,
        cart: state.cart
          .map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "LOAD_CART":
      return { ...state, cart: action.payload };

    default:
      return state;
  }
};

/**
 * Reactive Global Store using RxJS
 * Provides type-safe, reactive state management for microfrontends
 */
export class GlobalStore {
  private static instance: GlobalStore;
  private state$ = new BehaviorSubject<GlobalState>(initialState);
  private storageKey = "microfrontend-global-state";

  protected constructor() {
    this.loadFromStorage();
    this.setupStoragePersistence();
  }

  public static getInstance(): GlobalStore {
    if (!GlobalStore.instance) {
      GlobalStore.instance = new GlobalStore();
    }
    return GlobalStore.instance;
  }

  // Get current state snapshot
  getState(): GlobalState {
    return this.state$.value;
  }

  // Get observable state stream
  getState$(): Observable<GlobalState> {
    return this.state$.asObservable();
  }

  // Get specific slice of state
  select<K extends keyof GlobalState>(key: K): Observable<GlobalState[K]> {
    return this.state$.pipe(
      map((state) => state[key]),
      distinctUntilChanged()
    );
  }

  // Dispatch action to update state
  dispatch(action: GlobalAction): void {
    const currentState = this.state$.value;
    const newState = globalReducer(currentState, action);
    this.state$.next(newState);
  }

  // Convenience methods for cart operations
  addToCart(product: Product, quantity: number = 1): void {
    // First ensure product is in products array
    const currentState = this.getState();
    if (!currentState.products.find((p) => p.id === product.id)) {
      this.setProducts([...currentState.products, product]);
    }

    // Then add to cart
    this.dispatch({ type: "ADD_TO_CART", payload: { product, quantity } });
  }

  removeFromCart(productId: number): void {
    this.dispatch({ type: "REMOVE_FROM_CART", payload: productId });
  }

  updateCartQuantity(productId: number, quantity: number): void {
    this.dispatch({
      type: "UPDATE_CART_QUANTITY",
      payload: { productId, quantity },
    });
  }

  clearCart(): void {
    this.dispatch({ type: "CLEAR_CART" });
  }

  // Convenience methods for user operations
  setUser(user: User | null): void {
    this.dispatch({ type: "SET_USER", payload: user });
  }

  // Convenience methods for products
  setProducts(products: Product[]): void {
    this.dispatch({ type: "SET_PRODUCTS", payload: products });
  }

  // Load state from localStorage
  private loadFromStorage(): void {
    try {
      // Load from both new global storage and old individual keys for compatibility
      const stored = localStorage.getItem(this.storageKey);
      let parsedState = null;

      if (stored) {
        parsedState = JSON.parse(stored);
      }

      // Also check old auth storage format for compatibility
      const oldAuthToken = localStorage.getItem("authToken");
      const oldAuthUser = localStorage.getItem("authUser");

      // Load cart
      this.dispatch({ type: "LOAD_CART", payload: parsedState?.cart || [] });

      // Load user from new storage first, fallback to old storage
      let user = parsedState?.user || null;
      if (!user && oldAuthToken && oldAuthUser) {
        user = JSON.parse(oldAuthUser);
      }

      if (user) {
        this.dispatch({ type: "SET_USER", payload: user });
      }
    } catch (error) {}
  }

  // Setup automatic persistence to localStorage
  private setupStoragePersistence(): void {
    this.state$.subscribe((state) => {
      try {
        // Only persist important data, not transient states like loading/error
        const persistentState = {
          cart: state.cart,
          user: state.user,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(persistentState));

        // Also maintain compatibility with old auth storage format
        if (state.user) {
          localStorage.setItem("authUser", JSON.stringify(state.user));
          localStorage.setItem("authToken", "dummy-token"); // Auth app expects this
        } else {
          localStorage.removeItem("authUser");
          localStorage.removeItem("authToken");
        }
      } catch (error) {}
    });
  }

  // Development helper methods
  debug(): void {}

  // Subscribe to all state changes (for debugging)
  subscribe(callback: (state: GlobalState) => void): () => void {
    const subscription = this.state$.subscribe(callback);
    return () => subscription.unsubscribe();
  }
}

// Export singleton instance
export const globalStore = GlobalStore.getInstance();
