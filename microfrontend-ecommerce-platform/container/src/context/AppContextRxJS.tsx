import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { User, Product, globalStore } from "@microfrontend-ecommerce/shared";
import { useCart, useAuth, useProducts } from "../hooks/useRxJSStore";

// Extend window interface
declare global {
  interface Window {
    __GLOBAL_STORE__: any;
  }
}

// Simplified app state interface (keeping compatibility)
interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  cart: any[];
  cartCount: number;
  products: Product[];
  loading: boolean;
  error: string | null;
}

// Context interface (keeping same interface for compatibility)
interface AppContextType {
  state: AppState;
  login: (user: User) => void;
  logout: () => void;
  addToCart: (productId: number, quantity: number, product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  storeProduct: (product: Product) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component - MUCH simpler with RxJS!
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // ✅ All complex logic handled by RxJS hooks!
  const {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loading: cartLoading,
    error: cartError,
  } = useCart();

  const {
    isAuthenticated,
    user,
    login,
    logout,
    loading: authLoading,
    error: authError,
  } = useAuth();

  const {
    products,
    storeProduct,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  // Combine loading and error states
  const loading = cartLoading || authLoading || productsLoading;
  const error = cartError || authError || productsError;

  // Create state object to match old interface
  const state: AppState = {
    isAuthenticated,
    user,
    cart,
    cartCount,
    products,
    loading,
    error,
  };

  if (user) {
  }

  // Initialize auth state on mount
  useEffect(() => {
    // Expose global store to window for microfrontends
    window.__GLOBAL_STORE__ = globalStore;

    // The global store constructor already handles loading from localStorage
    // But we can trigger a re-check here if needed
    const currentUser = globalStore.getState().user;
    if (currentUser) {
    } else {
      // Check if there's legacy auth data
      const legacyUser = localStorage.getItem("authUser");
      const legacyToken = localStorage.getItem("authToken");

      if (legacyUser && legacyToken) {
        try {
          const user = JSON.parse(legacyUser);
          globalStore.setUser(user);
        } catch (error) {}
      }
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        login,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        storeProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook to use context (keeping same interface)
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
