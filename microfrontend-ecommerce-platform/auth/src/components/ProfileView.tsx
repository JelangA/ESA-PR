import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthRxJS } from '../hooks/useRxJSStore';
import { formatCurrency } from '@microfrontend-ecommerce/shared';

const ProfileView: React.FC = () => {
  const { state, logout } = useAuth();
  const rxjsAuth = useAuthRxJS();

  // Get user from RxJS store first, fallback to local state
  const currentUser = rxjsAuth.user || state.user;
  const isAuthenticated = rxjsAuth.isAuthenticated || state.isAuthenticated;

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const user = currentUser;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        // Clear global store if available
        const globalStore = window.__GLOBAL_STORE__;
        if (globalStore) {
          globalStore.setUser(null);
          globalStore.clearCart();
        }
        
        // Also call local logout as fallback
        logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback to simple redirect
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }
  };

  const mockStats = {
    totalOrders: 12,
    totalSpent: 456.78,
    favoriteCategory: "men's clothing",
    memberSince: '2023',
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.firstname.charAt(0).toUpperCase()}{user.name.lastname.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name.firstname} {user.name.lastname}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-primary-600">{mockStats.totalOrders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(mockStats.totalSpent)}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 capitalize">{mockStats.favoriteCategory}</div>
          <div className="text-sm text-gray-600">Favorite Category</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{mockStats.memberSince}</div>
          <div className="text-sm text-gray-600">Member Since</div>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 text-gray-900">{user.name.firstname} {user.name.lastname}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 text-gray-900">@{user.username}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1 text-gray-900">{user.phone}</div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Street Address</label>
              <div className="mt-1 text-gray-900">
                {user.address.number} {user.address.street}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <div className="mt-1 text-gray-900">{user.address.city}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Zip Code</label>
              <div className="mt-1 text-gray-900">{user.address.zipcode}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Coordinates</label>
              <div className="mt-1 text-gray-900 text-sm">
                {user.address.geolocation.lat}, {user.address.geolocation.long}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/products';
              }
            }}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Continue Shopping
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/cart';
              }
            }}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            View Cart
          </button>
          <button
            onClick={() => alert('Order history would be shown here')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order History
          </button>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Demo Account</h3>
            <p className="text-sm text-blue-700 mt-1">
              This is a demonstration account using mock data from the Fake Store API. 
              In a real application, this information would be fetched from your actual user profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
