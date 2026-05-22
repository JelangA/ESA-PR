import React, { useState } from "react";
import { CartProvider, useCart } from "./contexts/CartContextRxJS";
import CartItem from "./components/CartItem";
import CartSummary from "./components/CartSummary";
import EmptyCart from "./components/EmptyCart";
import "./index.css";
// Cart content component
const CartContent: React.FC = () => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const handleCheckout = () => {
    // In a real app, this would navigate to checkout
    alert("Checkout functionality would be implemented here!");
  };
  const handleClearCart = () => {
    if (showClearConfirm) {
      clearCart();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };
  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };
  if (state.loading) {
    return (
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <span className="ml-4 text-gray-600">Loading cart...</span>
        </div>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="py-12 text-center">
          <div className="mb-2 text-lg font-semibold text-red-500">
            {state.error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-4xl px-4 py-8 mx-auto">
        <EmptyCart />
      </div>
    );
  }
  return (
    <div className="px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mt-2 text-gray-600">
          {state.itemCount} {state.itemCount === 1 ? "item" : "items"} in your
          cart
        </p>
      </div>
      {/* Clear cart confirmation */}
      {showClearConfirm && (
        <div className="p-4 mb-6 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Are you sure you want to clear your cart?
              </h3>
              <p className="mt-1 text-sm text-red-700">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClearCart}
                className="px-3 py-1 text-sm text-white transition-colors bg-red-600 rounded hover:bg-red-700"
              >
                Yes, Clear
              </button>
              <button
                onClick={handleCancelClear}
                className="px-3 py-1 text-sm text-gray-800 transition-colors bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-4 lg:col-span-2">
          {state.items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>
        {/* Cart summary */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={state.total}
            itemCount={state.itemCount}
            onCheckout={handleCheckout}
            onClearCart={() => {
              handleClearCart();
            }}
          />
        </div>
      </div>
      {/* Continue shopping */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/products";
            }
          }}
          className="flex items-center transition-colors text-primary-600 hover:text-primary-700"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
// Main App component
const App: React.FC = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <CartContent />
      </div>
    </CartProvider>
  );
};
export default App;
