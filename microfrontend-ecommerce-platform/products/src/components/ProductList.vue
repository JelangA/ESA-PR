<template>
  <div class="products-list">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ currentCategory === 'all' ? 'All Products' : `${currentCategory} Products` }}
        </h1>
        <p class="text-gray-600">
          {{ filteredProducts.length }} product{{ filteredProducts.length !== 1 ? 's' : '' }} found
        </p>
      </div>
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
        <select
          v-model="selectedCategory"
          @change="onCategoryChange"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ formatCategory(category) }}
          </option>
        </select>
        <select
          v-model="selectedSort"
          @change="onSortChange"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="default">Default Sort</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
    </div>
    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="product-card p-4">
        <div class="skeleton h-48 mb-4"></div>
        <div class="space-y-2">
          <div class="skeleton-title"></div>
          <div class="skeleton-text w-3/4"></div>
          <div class="skeleton-text w-1/2"></div>
        </div>
      </div>
    </div>
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500 text-lg font-semibold mb-2">{{ error }}</div>
      <button
        @click="retry"
        class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
      >
        Try Again
      </button>
    </div>
    <!-- Debug info -->
    <div v-if="showDebugInfo" class="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
      <p><strong>🔍 Debug Info:</strong></p>
      <p>Loading: {{ loading }}</p>
      <p>Error: {{ error || 'None' }}</p>
      <p>Products count: {{ productsStore?.products?.length || 0 }}</p>
      <p>Filtered products count: {{ filteredProducts?.length || 0 }}</p>
      <p>Categories: {{ categories?.length || 0 }}</p>
      <p>Current category: {{ currentCategory }}</p>
      <div class="mt-3 flex gap-2">
        <button 
          @click="initializeData" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Reload Products
        </button>
        <button 
          @click="forceMount" 
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          🚀 Force Mount
        </button>
        <button 
          @click="showDebugInfo = false" 
          class="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500 transition-colors"
        >
          ✕ Hide
        </button>
      </div>
    </div>
    <!-- Products grid -->
    <div v-if="!loading && !error && filteredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
      />
    </div>
    <!-- Empty state -->
    <div v-else-if="!loading && !error && filteredProducts.length === 0" class="text-center py-12">
      <div class="text-gray-500 text-lg mb-4">No products found</div>
      <p class="text-gray-400">Try adjusting your filters or check back later.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, inject, watch, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { useProductsStore } from '../stores/products';
import ProductCard from './ProductCard.vue';
const route = useRoute();
const instance = getCurrentInstance();
let productsStore: ReturnType<typeof useProductsStore>;
try {
  productsStore = useProductsStore();
} catch (error) {
  console.error('Error initializing pinia store:', error);
  throw error;
}
const pinia = inject('pinia');
// Reactive refs
const selectedCategory = ref('all');
const selectedSort = ref<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
const showDebugInfo = ref(false); // Clean UI - set to true for debugging if needed
// Computed properties
const loading = computed(() => productsStore.loading);
const error = computed(() => productsStore.error);
const filteredProducts = computed(() => productsStore.filteredProducts);
const categories = computed(() => productsStore.categories);
const currentCategory = computed(() => {
  const category = route.params.category as string;
  return category || selectedCategory.value;
});
// Methods
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/'/g, '');
};
const onCategoryChange = () => {
  productsStore.setCategory(selectedCategory.value);
  if (selectedCategory.value !== 'all') {
    productsStore.fetchProductsByCategory(selectedCategory.value);
  } else {
    productsStore.fetchProducts();
  }
};
const onSortChange = () => {
  productsStore.setSortBy(selectedSort.value);
};
const retry = () => {
  productsStore.clearError();
  if (currentCategory.value !== 'all') {
    productsStore.fetchProductsByCategory(currentCategory.value);
  } else {
    productsStore.fetchProducts();
  }
};
const forceMount = async () => {
  showDebugInfo.value = true;
  // Reset everything
  productsStore.loading = false;
  productsStore.error = null;
  productsStore.products = [];
  productsStore.categories = [];
  try {
    // Force fresh API calls
    await Promise.all([
      productsStore.fetchProducts(),
      productsStore.fetchCategories()
    ]);
  } catch (error) {
    console.error('❌ ProductList: Force reload failed:', error);
  }
};
// Watch for route changes
watch(
  () => route.params.category,
  (newCategory) => {
    if (newCategory) {
      selectedCategory.value = newCategory as string;
      productsStore.fetchProductsByCategory(newCategory as string);
    }
  }
);
// Initialize on mount
const initializeData = async () => {
  // Force reset states
  if (productsStore) {
    productsStore.loading = false;
    productsStore.error = null;
  }
  // Fetch initial data
  try {
    await productsStore.fetchCategories();
    if (route.params.category) {
      await productsStore.fetchProductsByCategory(route.params.category as string);
    } else {
      await productsStore.fetchProducts();
    }
  } catch (err) {
    console.error('Error during data fetch:', err);
  }
};
onMounted(async () => {
  // Test API connection first
  try {
    const apiWorking = await productsStore.testApiConnection();
  } catch (error) {
    console.error('❌ API connection test failed:', error);
  }
  // Initialize data
  await initializeData();
  // Set initial category from route
  if (route.params.category) {
    selectedCategory.value = route.params.category as string;
  }
  // Debug state after initialization
  // Add retry mechanism with more debug info
  setTimeout(() => {
    if (productsStore.products.length === 0 && !productsStore.loading && !productsStore.error) {
      initializeData();
    } else if (productsStore.products.length > 0) {
    }
  }, 2000);
});
</script>
<style scoped>
.products-list {
  width: 100%;
  min-height: 400px;
  display: block;
}
/* Ensure debug info is visible */
.bg-blue-50 {
  background-color: #eff6ff !important;
  border: 1px solid #3b82f6;
}
/* Force visibility for products grid */
.grid {
  display: grid !important;
}
/* Skeleton loading styles */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 8px;
  border-radius: 4px;
}
.skeleton-text {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 4px;
  border-radius: 4px;
}
@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
