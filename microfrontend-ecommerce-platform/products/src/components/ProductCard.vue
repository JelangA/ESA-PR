<template>
  <div class="p-4 cursor-pointer product-card" @click="goToProduct">
    <div class="relative">
      <img :src="product.image" :alt="product.title" class="product-image" @error="handleImageError" />
      <div class="absolute top-2 right-2">
        <span class="px-2 py-1 text-xs font-medium text-gray-700 bg-white rounded-md shadow-sm">
          {{ product.category }}
        </span>
      </div>
    </div>
    <div class="mt-4 space-y-2">
      <h3 class="product-title">{{ product.title }}</h3>
      <div class="flex items-center justify-between">
        <span class="product-price">${{ product.price.toFixed(2) }}</span>
        <div class="product-rating">
          <span class="text-yellow-400">★</span>
          <span>{{ product.rating.rate }}</span>
          <span class="text-gray-500">({{ product.rating.count }})</span>
        </div>
      </div>
      <p class="text-sm text-gray-600 line-clamp-2">{{ product.description }}</p>
      <!-- Add to Cart Button (when not in cart) -->
      <button v-if="!productInCart" @click.stop="addToCart" :disabled="addingToCart" :class="[
        'w-full py-2 px-4 rounded-md transition-colors mt-3 font-medium',
        addingToCart
          ? 'bg-green-500 text-white'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      ]">
        <span v-if="addingToCart" class="flex items-center justify-center">
          <svg class="w-4 h-4 mr-2 -ml-1 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Added!
        </span>
        <span v-else>Add to Cart</span>
      </button>

      <!-- Quantity Controls (when in cart) -->
      <div v-else
        class="flex items-center justify-center w-full px-4 py-2 mt-3 space-x-3 border border-green-200 rounded-md bg-green-50"
        @click.stop>
        <!-- Decrement Button -->
        <button @click="decrementQuantity" :disabled="productQuantity <= 1"
          class="flex items-center justify-center flex-shrink-0 text-white transition-colors duration-200 bg-green-600 rounded-full w-7 h-7 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>

        <!-- Quantity Display -->
        <div class="flex-1 text-center">
          <span class="text-sm font-medium text-green-800">{{ productQuantity }}</span>
        </div>

        <!-- Increment Button -->
        <button @click="incrementQuantity"
          class="flex items-center justify-center flex-shrink-0 text-white transition-colors duration-200 bg-green-600 rounded-full w-7 h-7 hover:bg-green-700">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, computed } from 'vue';
import { Product } from '@microfrontend-ecommerce/shared';
import { useCart } from '../composables/useRxJSStore';
interface Props {
  product: Product;
}
const props = defineProps<Props>();
const router = inject('router') as any;
const { addToCart: addToRxJSCart, updateQuantity, isInCart, getProductQuantity } = useCart();
const addingToCart = ref(false);

// Cart state for this product
const productInCart = computed(() => isInCart(props.product.id).value);
const productQuantity = computed(() => getProductQuantity(props.product.id).value);
// Router and product validation (keep minimal logging)
if (process.env.NODE_ENV === 'development') {
}
const goToProduct = () => {
  // Validate product ID first
  if (!props.product?.id) {
    return;
  }
  const productId = props.product.id;
  const containerUrl = `/products/product/${productId}`;
  const vueRoute = `/product/${productId}`;
  // Update browser URL (container handles this)
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState({}, '', containerUrl);
      // Trigger popstate event to notify ReactWrapper
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    } catch (error) {
      return; // Don't attempt router navigation if URL update fails
    }
  }
  // Vue router navigation with memory history (safe)
  if (router) {
    router.push(vueRoute).then(() => {
    }).catch((error: any) => {
      console.warn('Router navigation error:', error);
    });
  } else {
  }
};
const addToCart = () => {
  addingToCart.value = true;
  // ✅ Use RxJS store directly - much simpler and more reliable!
  try {
    addToRxJSCart(props.product, 1);
  } catch (error) {
  }
  // Reset button state after animation
  setTimeout(() => {
    addingToCart.value = false;
  }, 1500);
};

const incrementQuantity = () => {
  const currentQty = productQuantity.value;
  updateQuantity(props.product.id, currentQty + 1);
};

const decrementQuantity = () => {
  const currentQty = productQuantity.value;
  if (currentQty > 1) {
    updateQuantity(props.product.id, currentQty - 1);
  }
};
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iMC4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
};
</script>
