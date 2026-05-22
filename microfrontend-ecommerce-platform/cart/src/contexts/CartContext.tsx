import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Product,
  CartItem,
  productsApi,
  storage,
} from "@microfrontend-ecommerce/shared";
// Extended cart item with product details
export interface CartItemWithProduct extends CartItem {
  product?: Product;
}
// State interface
interface CartState {
  items: CartItemWithProduct[];
  loading: boolean;
  error: string | null;
  total: number;
  itemCount: number;
}
// Action types
type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_ITEM"; payload: CartItemWithProduct }
  | { type: "REMOVE_ITEM"; payload: number }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: number; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItemWithProduct[] }
  | {
      type: "UPDATE_PRODUCT_DETAILS";
      payload: { productId: number; product: Product };
    };
// Initial state - START with loading = true to prevent empty cart flash
const initialState: CartState = {
  items: [],
  loading: true, // Start with loading to prevent showing empty cart immediately
  error: null,
  total: 0,
  itemCount: 0,
};
// Helper function to calculate totals
const calculateTotals = (items: CartItemWithProduct[]) => {
  const total = items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};
// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      let newItems: CartItemWithProduct[];
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      const { total, itemCount } = calculateTotals(newItems);
      const newState = {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
      return newState;
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => item.productId !== action.payload
      );
      const { total, itemCount } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
        .filter((item) => item.quantity > 0);
      const { total, itemCount } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }
    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
      };
    case "LOAD_CART": {
      const { total, itemCount } = calculateTotals(action.payload);

      const newState = {
        ...state,
        items: action.payload,
        total,
        itemCount,
        loading: false, // Set loading to false when cart data is loaded
      };

      return newState;
    }
    case "UPDATE_PRODUCT_DETAILS": {
      const newItems = state.items.map((item) =>
        item.productId === action.payload.productId
          ? { ...item, product: action.payload.product }
          : item
      );
      const { total, itemCount } = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }
    default:
      return state;
  }
};
// Context
interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
// Provider component
interface CartProviderProps {
  children: ReactNode;
}
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Prevent multiple providers by checking global flag - FIX: Don't return null
  if ((window as any).__CART_PROVIDER_ACTIVE__) {
  } else {
    (window as any).__CART_PROVIDER_ACTIVE__ = true;
  }
  const [state, dispatch] = useReducer(cartReducer, initialState);
  // Track state changes
  useEffect(() => {
    // State updated
  }, [state.items.length, state.itemCount, state.total]);
  // Track if initial load is complete to prevent premature saves
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Save cart to localStorage whenever it changes - ONLY after initialization
  useEffect(() => {
    // Don't save until cart has been loaded from localStorage at least once
    if (!isInitialized) {
      return;
    }

    storage.set("cart", state.items);
  }, [state.items, isInitialized]);
  // Load product details for cart items
  const loadProductDetails = async (items: CartItemWithProduct[]) => {
    const itemsWithoutProducts = items.filter((item) => !item.product);

    if (itemsWithoutProducts.length === 0) {
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const productPromises = itemsWithoutProducts.map((item) =>
        productsApi.getProduct(item.productId)
      );
      const products = await Promise.all(productPromises);

      products.forEach((product, index) => {
        const item = itemsWithoutProducts[index];
        dispatch({
          type: "UPDATE_PRODUCT_DETAILS",
          payload: { productId: item.productId, product },
        });
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load product details",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };
  // Action creators
  const addItem = useCallback((product: Product, quantity: number) => {
    const cartItem: CartItemWithProduct = {
      productId: product.id,
      quantity,
      product,
    };
    dispatch({ type: "ADD_ITEM", payload: cartItem });
  }, []);
  const removeItem = useCallback((productId: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId });
    // Also remove from localStorage immediately
    const currentCart = storage.get("cart") || [];
    const filteredCart = currentCart.filter(
      (item: any) => item.productId !== productId
    );
    storage.set("cart", filteredCart);
  }, []);
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
    // Also update localStorage immediately
    const currentCart = storage.get("cart") || [];
    const updatedCart = currentCart
      .map((item: any) =>
        item.productId === productId ? { ...item, quantity } : item
      )
      .filter((item: any) => item.quantity > 0);
    storage.set("cart", updatedCart);
  }, []);
  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    storage.remove("cart");
  }, []);
  const loadCart = useCallback(async () => {
    const savedCart = storage.get("cart") || [];

    // ALWAYS dispatch LOAD_CART - even for empty cart to set loading = false
    dispatch({ type: "LOAD_CART", payload: savedCart });

    if (savedCart.length > 0) {
      // Check if products already have details
      const itemsWithoutProducts = savedCart.filter(
        (item: any) => !item.product
      );

      if (itemsWithoutProducts.length > 0) {
        await loadProductDetails(savedCart);
      } else {
      }
    } else {
    }

    // Mark as initialized to allow localStorage saves
    setIsInitialized(true);
  }, []); // Empty dependency - setIsInitialized is stable
  // Subscribe to events from other microfrontends - AGGRESSIVE FIX
  useEffect(() => {
    // Prevent multiple subscriptions
    if ((window as any).__CART_EVENT_HANDLER_SETUP__) {
      return;
    }
    (window as any).__CART_EVENT_HANDLER_SETUP__ = true;
    const handleAddToCart = (data: { product: Product; quantity: number }) => {
      // Check if Container has already saved to localStorage
      const currentStorage = storage.get("cart") || [];
      const existingInStorage = currentStorage.find(
        (item: any) => item.productId === data.product.id
      );

      if (existingInStorage) {
        // Just dispatch LOAD_CART to sync state with localStorage (no doubling)
        dispatch({ type: "LOAD_CART", payload: currentStorage });
        return;
      }

      const cartItem: CartItemWithProduct = {
        productId: data.product.id,
        quantity: data.quantity,
        product: data.product,
      };
      dispatch({ type: "ADD_ITEM", payload: cartItem });

      // Don't manually save to localStorage - let the save useEffect handle it after initialization
    };
    // Process buffered events that occurred before Cart was ready
    const bufferedEvents = (window as any).__CART_EVENT_BUFFER__ || [];
    if (bufferedEvents.length > 0) {
      bufferedEvents.forEach((event: any) => {
        if (event.type === "ADD_TO_CART_FORWARD") {
          handleAddToCart(event.data);
        }
      });
      // Clear processed events
      (window as any).__CART_EVENT_BUFFER__ = [];
    }
    return () => {
      (window as any).__CART_EVENT_HANDLER_SETUP__ = false;
      (window as any).__CART_PROVIDER_ACTIVE__ = false;
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const directStorageCheck = localStorage.getItem("cart");
      loadCart();
    }, 100);
  }, [loadCart]);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
// Hook to use context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
