import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { Product } from "@microfrontend-ecommerce/shared";
import { useCart as useRxJSCart } from "../hooks/useRxJSStore";

// Extended cart item with product details (keeping same interface)
export interface CartItemWithProduct {
  productId: number;
  quantity: number;
  product?: Product;
}

// State interface (keeping same interface for compatibility)
interface CartState {
  items: CartItemWithProduct[];
  loading: boolean;
  error: string | null;
  total: number;
  itemCount: number;
}

// Context interface (keeping same interface)
interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component - MUCH simpler with RxJS!
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // ✅ All the complex logic is now handled by RxJS hooks!
  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    total,
    itemCount,
    loading,
    error,
  } = useRxJSCart();

  // Initialize cart on mount and watch for cart changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Auto-load missing product details when cart changes
  useEffect(() => {
    const missingProducts = items.filter((item) => !item.product);
    if (missingProducts.length > 0 && !loading) {
      loadCart(); // This will fetch missing product details
    }
  }, [items.length, loading, loadCart]); // Watch for cart changes

  // Create state object to match old interface
  const state: CartState = {
    items,
    loading,
    error,
    total,
    itemCount,
  };

  // Wrap functions to match old interface
  const addItem = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity);
  };

  const removeItem = (productId: number) => {
    removeFromCart(productId);
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity: updateItemQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use context (keeping same interface)
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
