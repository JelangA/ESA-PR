import { ref, computed, onMounted, onUnmounted } from "vue";
import { globalStore } from "@microfrontend-ecommerce/shared";
import type { Product, GlobalState } from "@microfrontend-ecommerce/shared";

/**
 * Vue composable for RxJS Global Store
 */
export const useGlobalStore = () => {
  const state = ref<GlobalState>(globalStore.getState());

  let subscription: any = null;

  onMounted(() => {
    subscription = globalStore.subscribe((newState: GlobalState) => {
      state.value = newState;
    });
  });

  onUnmounted(() => {
    if (subscription) {
      subscription();
    }
  });

  const dispatch = (action: any) => {
    globalStore.dispatch(action);
  };

  return {
    state: computed(() => state.value),
    dispatch,
  };
};

/**
 * Vue composable for cart operations
 */
export const useCart = () => {
  const { state } = useGlobalStore();

  const cart = computed(() => state.value.cart);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  // Calculate totals
  const total = computed(() => {
    return cart.value.reduce((sum, item) => {
      const product = state.value.products.find((p) => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  });

  const itemCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const addToCart = (product: Product, quantity: number = 1) => {
    // First ensure product is in global products store
    const currentProducts = globalStore.getState().products;
    if (!currentProducts.find((p) => p.id === product.id)) {
      globalStore.setProducts([...currentProducts, product]);
    }

    // Then add to cart
    globalStore.addToCart(product, quantity);
  };

  const removeFromCart = (productId: number) => {
    globalStore.removeFromCart(productId);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    globalStore.updateCartQuantity(productId, quantity);
  };

  const clearCart = () => {
    globalStore.clearCart();
  };

  // Get cart item for specific product
  const getCartItem = (productId: number) => {
    return computed(() =>
      cart.value.find((item) => item.productId === productId)
    );
  };

  // Check if product is in cart
  const isInCart = (productId: number) => {
    return computed(() =>
      cart.value.some((item) => item.productId === productId)
    );
  };

  // Get quantity for specific product
  const getProductQuantity = (productId: number) => {
    return computed(() => {
      const item = cart.value.find((item) => item.productId === productId);
      return item ? item.quantity : 0;
    });
  };

  return {
    cart,
    total,
    itemCount,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItem,
    isInCart,
    getProductQuantity,
  };
};

/**
 * Vue composable for auth operations
 */
export const useAuth = () => {
  const { state } = useGlobalStore();

  const user = computed(() => state.value.user);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);
  const isAuthenticated = computed(() => !!state.value.user);

  const setUser = (user: any) => {
    globalStore.setUser(user);
  };

  const logout = () => {
    globalStore.setUser(null);
    globalStore.clearCart(); // Clear cart on logout
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    setUser,
    logout,
  };
};

/**
 * Vue composable for products operations
 */
export const useProducts = () => {
  const { state } = useGlobalStore();

  const products = computed(() => state.value.products);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  const setProducts = (products: Product[]) => {
    globalStore.setProducts(products);
  };

  const getProduct = (id: number): Product | undefined => {
    return products.value.find((p) => p.id === id);
  };

  return {
    products,
    loading,
    error,
    setProducts,
    getProduct,
  };
};
