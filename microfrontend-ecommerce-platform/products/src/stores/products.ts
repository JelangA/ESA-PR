import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Product, productsApi } from '@microfrontend-ecommerce/shared';
export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);
  const categories = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedCategory = ref<string>('all');
  const sortBy = ref<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
  // Getters
  const filteredProducts = computed(() => {
    let filtered = [...products.value];
    // Filter by category
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory.value);
    }
    // Sort products
    switch (sortBy.value) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating.rate - a.rating.rate);
        break;
      default:
        // Keep original order
        break;
    }
    return filtered;
  });
  const productsByCategory = computed(() => {
    const grouped: { [key: string]: Product[] } = {};
    categories.value.forEach(category => {
      grouped[category] = products.value.filter(product => product.category === category);
    });
    return grouped;
  });
  // Actions
  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await productsApi.getAllProducts();
      products.value = data;
    } catch (err) {
      error.value = 'Failed to fetch products';
      console.error('Error fetching products:', err);
    } finally {
      loading.value = false;
    }
  };
  const fetchProduct = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await productsApi.getProduct(id);
      currentProduct.value = data;
    } catch (err) {
      error.value = 'Failed to fetch product';
      console.error('❌ ProductStore: Error fetching product:', err);
    } finally {
      loading.value = false;
    }
  };
  const fetchCategories = async () => {
    try {
      const data = await productsApi.getCategories();
      categories.value = data;
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  const fetchProductsByCategory = async (category: string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await productsApi.getProductsByCategory(category);
      products.value = data;
      selectedCategory.value = category;
    } catch (err) {
      error.value = 'Failed to fetch products by category';
      console.error('Error fetching products by category:', err);
    } finally {
      loading.value = false;
    }
  };
  const setCategory = (category: string) => {
    selectedCategory.value = category;
  };
  const setSortBy = (sort: typeof sortBy.value) => {
    sortBy.value = sort;
  };
  const clearError = () => {
    error.value = null;
  };
  const getProductById = (id: number): Product | undefined => {
    return products.value.find(product => product.id === id);
  };
  const testApiConnection = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products?limit=1');
      const data = await response.json();
      return true;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  };
  return {
    // State
    products,
    currentProduct,
    categories,
    loading,
    error,
    selectedCategory,
    sortBy,
    // Getters
    filteredProducts,
    productsByCategory,
    // Actions
    fetchProducts,
    fetchProduct,
    fetchCategories,
    fetchProductsByCategory,
    setCategory,
    setSortBy,
    clearError,
    getProductById,
    testApiConnection,
  };
});
