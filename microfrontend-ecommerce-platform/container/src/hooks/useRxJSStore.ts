import { useEffect, useState, useCallback } from "react";
import {
  GlobalStore,
  GlobalState,
  GlobalAction,
  globalStore,
} from "@microfrontend-ecommerce/shared";
import { Product, User } from "@microfrontend-ecommerce/shared";

/**
 * React hook to use RxJS global store in Container app
 */
export const useGlobalStore = () => {
  const [state, setState] = useState<GlobalState>(globalStore.getState());

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(setState);
    return unsubscribe;
  }, []);

  const dispatch = useCallback((action: GlobalAction) => {
    globalStore.dispatch(action);
  }, []);

  return { state, dispatch };
};

/**
 * Hook to select specific slice of global state
 */
export const useGlobalSelector = <K extends keyof GlobalState>(
  key: K
): GlobalState[K] => {
  const [value, setValue] = useState<GlobalState[K]>(
    globalStore.getState()[key]
  );

  useEffect(() => {
    const subscription = globalStore.select(key).subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [key]);

  return value;
};

/**
 * Container-specific cart hook with enhanced functionality
 */
export const useCart = () => {
  const cart = useGlobalSelector("cart");
  const products = useGlobalSelector("products");
  const loading = useGlobalSelector("loading");
  const error = useGlobalSelector("error");

  // Get cart with full product details
  const cartWithProducts = cart.map((item: { productId: any }) => {
    const product = products.find((p: { id: any }) => p.id === item.productId);
    return { ...item, product };
  });

  // Calculate cart count and total
  const cartCount = cart.reduce(
    (sum: any, item: { quantity: any }) => sum + item.quantity,
    0
  );
  const total = cartWithProducts.reduce(
    (sum: number, item: { product: { price: any }; quantity: number }) => {
      return sum + (item.product?.price || 0) * item.quantity;
    },
    0
  );

  const addToCart = useCallback(
    (productId: number, quantity: number, product: Product) => {
      // Store product info first if not already stored
      if (!products.find((p: { id: number }) => p.id === productId)) {
        globalStore.setProducts([...products, product]);
      }

      // Then add to cart
      globalStore.addToCart(product, quantity);
    },
    [products]
  );

  const removeFromCart = useCallback((productId: number) => {
    globalStore.removeFromCart(productId);
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    globalStore.updateCartQuantity(productId, quantity);
  }, []);

  const clearCart = useCallback(() => {
    globalStore.clearCart();
  }, []);

  return {
    cart: cartWithProducts,
    cartCount,
    total,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};

/**
 * Container-specific auth hook
 */
export const useAuth = () => {
  const user = useGlobalSelector("user");
  const loading = useGlobalSelector("loading");
  const error = useGlobalSelector("error");

  const login = useCallback((user: User) => {
    globalStore.setUser(user);
  }, []);

  // Simple logout - just clear store and redirect
  const logout = useCallback(async () => {
    try {
      // Clear RxJS global store
      globalStore.setUser(null);
      globalStore.clearCart();

      // Simple redirect to home
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }, 100);
    } catch (error) {
      // Fallback
      globalStore.setUser(null);
      globalStore.clearCart();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, []);

  return {
    isAuthenticated: !!user,
    user,
    loading,
    error,
    login,
    logout,
  };
};

/**
 * Container-specific products hook
 */
export const useProducts = () => {
  const products = useGlobalSelector("products");
  const loading = useGlobalSelector("loading");
  const error = useGlobalSelector("error");

  const storeProduct = useCallback((product: Product) => {
    const existingProducts = globalStore.getState().products;
    if (!existingProducts.find((p: any) => p.id === product.id)) {
      globalStore.setProducts([...existingProducts, product]);
    }
  }, []);

  const setProducts = useCallback((products: Product[]) => {
    globalStore.setProducts(products);
  }, []);

  const getProduct = useCallback(
    (id: number): Product | undefined => {
      return products.find((p: any) => p.id === id);
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    storeProduct,
    setProducts,
    getProduct,
  };
};
