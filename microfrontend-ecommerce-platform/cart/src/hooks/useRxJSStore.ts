import { useEffect, useState, useCallback } from "react";
import {
  GlobalStore,
  GlobalState,
  GlobalAction,
  globalStore,
  productsApi,
} from "@microfrontend-ecommerce/shared";
import { Product, CartItem } from "@microfrontend-ecommerce/shared";

/**
 * React hook to use RxJS global store in Cart app
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
 * Enhanced cart hook with full product details
 */
export const useCart = () => {
  const cart = useGlobalSelector("cart");
  const products = useGlobalSelector("products");
  const loading = useGlobalSelector("loading");
  const error = useGlobalSelector("error");

  // Get cart with full product details
  const cartWithProducts = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product };
  });

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    // First ensure product is in global products store
    const currentProducts = globalStore.getState().products;
    if (!currentProducts.find((p) => p.id === product.id)) {
      globalStore.setProducts([...currentProducts, product]);
    }

    // Then add to cart
    globalStore.addToCart(product, quantity);
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    globalStore.removeFromCart(productId);
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    globalStore.updateCartQuantity(productId, quantity);
  }, []);

  const clearCart = useCallback(() => {
    globalStore.clearCart();

    // Force immediate UI update
    setTimeout(() => {}, 50);
  }, []);

  const loadCart = useCallback(async () => {
    try {
      globalStore.dispatch({ type: "SET_LOADING", payload: true });

      const currentState = globalStore.getState();
      const cartItems = currentState.cart;
      const existingProducts = currentState.products;

      // Find cart items that don't have corresponding product details
      const itemsNeedingProducts = cartItems.filter(
        (item) => !existingProducts.find((p) => p.id === item.productId)
      );

      if (itemsNeedingProducts.length > 0) {
        // Fetch missing product details
        const productPromises = itemsNeedingProducts.map((item) =>
          productsApi.getProduct(item.productId)
        );

        const products = await Promise.all(productPromises);

        // Add products to global store
        const updatedProducts = [...existingProducts, ...products];
        globalStore.setProducts(updatedProducts);

        products.forEach((product) => {});
      }
    } catch (error) {
      globalStore.dispatch({
        type: "SET_ERROR",
        payload: "Failed to load product details",
      });
    } finally {
      globalStore.dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Calculate totals
  const total = cartWithProducts.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartWithProducts, // Match existing interface
    cart: cartWithProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    total,
    itemCount,
    loading,
    error,
  };
};
