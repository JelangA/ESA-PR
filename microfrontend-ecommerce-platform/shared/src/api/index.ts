import axios, { AxiosResponse } from 'axios';
import { Product, Cart, User, LoginCredentials, AuthResponse } from '../types';

const API_BASE_URL = 'https://fakestoreapi.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Products API
export const productsApi = {
  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    const response: AxiosResponse<Product[]> = await api.get('/products');
    return response.data;
  },

  // Get single product
  getProduct: async (id: number): Promise<Product> => {
    const response: AxiosResponse<Product> = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<string[]> => {
    const response: AxiosResponse<string[]> = await api.get('/products/categories');
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const response: AxiosResponse<Product[]> = await api.get(`/products/category/${category}`);
    return response.data;
  },

  // Get limited products with sorting
  getLimitedProducts: async (limit?: number, sort?: 'asc' | 'desc'): Promise<Product[]> => {
    let url = '/products';
    const params = new URLSearchParams();
    
    if (limit) params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response: AxiosResponse<Product[]> = await api.get(url);
    return response.data;
  },
};

// Carts API
export const cartsApi = {
  // Get all carts
  getAllCarts: async (): Promise<Cart[]> => {
    const response: AxiosResponse<Cart[]> = await api.get('/carts');
    return response.data;
  },

  // Get single cart
  getCart: async (id: number): Promise<Cart> => {
    const response: AxiosResponse<Cart> = await api.get(`/carts/${id}`);
    return response.data;
  },

  // Get user carts
  getUserCarts: async (userId: number): Promise<Cart[]> => {
    const response: AxiosResponse<Cart[]> = await api.get(`/carts/user/${userId}`);
    return response.data;
  },

  // Add new cart
  addCart: async (cart: Omit<Cart, 'id'>): Promise<Cart> => {
    const response: AxiosResponse<Cart> = await api.post('/carts', cart);
    return response.data;
  },

  // Update cart
  updateCart: async (id: number, cart: Partial<Cart>): Promise<Cart> => {
    const response: AxiosResponse<Cart> = await api.put(`/carts/${id}`, cart);
    return response.data;
  },

  // Delete cart
  deleteCart: async (id: number): Promise<Cart> => {
    const response: AxiosResponse<Cart> = await api.delete(`/carts/${id}`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response: AxiosResponse<User[]> = await api.get('/users');
    return response.data;
  },

  // Get single user
  getUser: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/${id}`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  },
};

// Export default api instance for custom requests
export default api;
