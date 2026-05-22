<template>
  <div class="product-detail">
    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="skeleton h-96"></div>
        <div class="space-y-4">
          <div class="h-8 skeleton-title"></div>
          <div class="w-1/3 h-6 skeleton-text"></div>
          <div class="h-4 skeleton-text"></div>
          <div class="h-4 skeleton-text"></div>
          <div class="w-3/4 h-4 skeleton-text"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-12 text-center">
      <div class="mb-2 text-lg font-semibold text-red-500">{{ error }}</div>
      <button @click="retry"
        class="px-6 py-2 text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700">
        Try Again
      </button>
    </div>
    <!-- Product detail -->
    <div v-else-if="product" class="space-y-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center space-x-2 text-sm text-gray-500">
        <button @click="goBack" class="hover:text-primary-600">← Back to Products</button>
        <span>/</span>
        <span class="text-gray-900">{{ product.title }}</span>
      </nav>
      <!-- Product content -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Product image -->
        <div class="space-y-4">
          <div class="p-8 bg-white border rounded-lg shadow-sm aspect-square">
            <img :src="product.image" :alt="product.title" class="object-contain w-full h-full"
              @error="handleImageError" />
          </div>
        </div>
        <!-- Product info -->
        <div class="space-y-6">
          <div>
            <div class="flex items-center mb-2 space-x-2">
              <span class="px-2 py-1 text-sm font-medium rounded-md bg-primary-100 text-primary-800">
                {{ formatCategory(product.category) }}
              </span>
            </div>
            <h1 class="mb-4 text-3xl font-bold text-gray-900">{{ product.title }}</h1>
            <!-- Rating -->
            <div class="flex items-center mb-4 space-x-2">
              <div class="flex items-center">
                <span v-for="star in 5" :key="star" class="text-yellow-400">
                  {{ star <= Math.round(product.rating.rate) ? '★' : '☆' }} </span>
              </div>
              <span class="text-gray-600">{{ product.rating.rate }}</span>
              <span class="text-gray-500">({{ product.rating.count }} reviews)</span>
            </div>
            <!-- Price -->
            <div class="mb-6 text-4xl font-bold text-primary-600">
              ${{ product.price.toFixed(2) }}
            </div>
            <!-- Description -->
            <div class="prose max-w-none">
              <h3 class="mb-2 text-lg font-semibold text-gray-900">Description</h3>
              <p class="leading-relaxed text-gray-600">{{ product.description }}</p>
            </div>
          </div>
          <!-- Actions -->
          <div class="pt-6 space-y-4 border-t">
            <div class="flex items-center space-x-4">
              <label for="quantity" class="text-sm font-medium text-gray-700">Quantity:</label>
              <select v-model="quantity" id="quantity"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option v-for="i in 10" :key="i" :value="i">{{ i }}</option>
              </select>
            </div>
            <!-- Add to Cart Button (when not in cart) -->
            <button v-if="!productInCart" @click="addToCart" :disabled="addingToCart" :class="[
              'w-full py-3 px-6 rounded-md transition-all font-medium text-lg',
              addingToCart
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
            ]">
              <span v-if="addingToCart" class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-3 -ml-1 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Added to Cart!
              </span>
              <span v-else>Add to Cart - ${{ (product.price * quantity).toFixed(2) }}</span>
            </button>

            <!-- Quantity Controls (when in cart) -->
            <div v-else
              class="flex items-center justify-center w-full px-6 py-3 space-x-6 border border-green-200 rounded-md bg-green-50">
              <!-- Decrement Button -->
              <button @click="decrementProductQuantity" :disabled="productQuantity <= 1"
                class="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white transition-colors duration-200 bg-green-600 rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>

              <!-- Quantity Display -->
              <div class="flex-1 text-center">
                <div class="text-2xl font-bold text-green-800">{{ productQuantity }}</div>
                <div class="text-sm font-medium text-green-600">in cart</div>
                <div class="text-xs text-green-500">Total: ${{ (product.price * productQuantity).toFixed(2) }}</div>
              </div>

              <!-- Increment Button -->
              <button @click="incrementProductQuantity"
                class="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white transition-colors duration-200 bg-green-600 rounded-full hover:bg-green-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <button @click="buyNow"
              class="w-full px-6 py-3 font-medium text-white transition-colors bg-green-600 rounded-md hover:bg-green-700">
              Buy Now
            </button>
          </div>
          <!-- Product features -->
          <div class="grid grid-cols-2 gap-4 pt-6 border-t">
            <div class="p-4 text-center rounded-lg bg-gray-50">
              <div class="mb-2 text-2xl">🚚</div>
              <div class="text-sm font-medium text-gray-900">Free Shipping</div>
              <div class="text-xs text-gray-500">On orders over $50</div>
            </div>
            <div class="p-4 text-center rounded-lg bg-gray-50">
              <div class="mb-2 text-2xl">↩️</div>
              <div class="text-sm font-medium text-gray-900">Easy Returns</div>
              <div class="text-xs text-gray-500">30-day return policy</div>
            </div>
          </div>
        </div>
      </div>
      <!-- Related products -->
      <div v-if="relatedProducts.length > 0" class="pt-12 border-t">
        <h2 class="mb-6 text-2xl font-bold text-gray-900">Related Products</h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ProductCard v-for="relatedProduct in relatedProducts" :key="relatedProduct.id" :product="relatedProduct" />
        </div>
      </div>
    </div>
    <!-- Not found -->
    <div v-else class="py-12 text-center">
      <div class="mb-4 text-lg text-gray-500">Product not found</div>
      <p class="mb-4 text-gray-400">The requested product could not be found.</p>
      <button @click="goBack"
        class="px-6 py-2 text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700">
        ← Back to Products
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, inject, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductsStore } from '../stores/products';
import { useCart } from '../composables/useRxJSStore';
import ProductCard from './ProductCard.vue';
interface Props {
  id?: string;
}
const props = defineProps<Props>();
const showDebugInfo = ref(false); // Clean UI - set to true for debugging if needed
const route = useRoute();
const router = inject('router') as any;
const productsStore = useProductsStore();
const { addToCart: addToRxJSCart, updateQuantity, isInCart, getProductQuantity } = useCart();
// Component setup validation (development only)
if (process.env.NODE_ENV === 'development') {
}
// Reactive refs
const quantity = ref(1);
const addingToCart = ref(false);

// Cart state for current product
const productInCart = computed(() => product.value ? isInCart(product.value.id).value : false);
const productQuantity = computed(() => product.value ? getProductQuantity(product.value.id).value : 0);
// Computed properties
const loading = computed(() => productsStore.loading);
const error = computed(() => productsStore.error);
const product = computed(() => productsStore.currentProduct);
const relatedProducts = computed(() => {
  if (!product.value) return [];
  return productsStore.products
    .filter(p => p.category === product.value?.category && p.id !== product.value?.id)
    .slice(0, 4);
});
// Methods
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/'/g, '');
};
const addToCart = () => {
  if (product.value) {
    addingToCart.value = true;
    try {
      addToRxJSCart(product.value, quantity.value);
    } catch (error) {
    }
    // Reset button state after animation
    setTimeout(() => {
      addingToCart.value = false;
    }, 2000);
  } else {
  }
};

const incrementProductQuantity = () => {
  if (product.value) {
    const currentQty = productQuantity.value;
    updateQuantity(product.value.id, currentQty + 1);
  }
};

const decrementProductQuantity = () => {
  if (product.value) {
    const currentQty = productQuantity.value;
    if (currentQty > 1) {
      updateQuantity(product.value.id, currentQty - 1);
    }
  }
};
const buyNow = () => {
  addToCart();
  // Navigate to cart
  if (router) {
    router.push('/cart');
  }

  router.push('/');
};
const goBack = () => {
  // Update container URL directly for microfrontend compatibility
  const productsUrl = '/products';
  if (typeof window !== 'undefined') {
    // Update browser URL
    window.history.pushState({}, '', productsUrl);
    // Trigger popstate event to notify other components
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }
  // Also update Vue router
  if (router) {
    router.push('/').catch((error: any) => {
      // If even root navigation fails, force reload as last resort
      if (typeof window !== 'undefined') {
        window.location.href = '/products';
      }
    });
  } else {
    if (typeof window !== 'undefined') {
      window.location.href = '/products';
    }
  }
};
const retry = () => {
  const productId = parseInt(props.id || route.params.id as string);
  if (productId) {
    productsStore.clearError();
    productsStore.fetchProduct(productId);
  }
};
const testDirectAPI = async () => {
  const productId = parseInt(props.id || route.params.id as string) || 3;
  try {
    const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
    const data = await response.json();
    alert(`API Test Success: ${data.title}`);
  } catch (error) {
  }
};
const testRouterNavigation = () => {
  if (router) {
    router.push('/').then(() => {
    }).catch((error: any) => {
    });
  }
};
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iMC4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk5OTk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
};
// Watch for route changes
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      const productId = parseInt(newId as string);
      productsStore.fetchProduct(productId);
    }
  }
);
// Initialize on mount
onMounted(async () => {
  const productId = parseInt(props.id || route.params.id as string);
  if (productId && !isNaN(productId)) {
    try {
      await productsStore.fetchProduct(productId);
    } catch (error) {
    }
  } else {
  }
  // Ensure we have all products for related products
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts();
  }
});
</script>
