import React from 'react';
import { formatCurrency } from '@microfrontend-ecommerce/shared';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  onClearCart: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  itemCount,
  onCheckout,
  onClearCart,
}) => {
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="checkout-summary">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-2">
        <div className="checkout-row">
          <span className="text-gray-600">
            Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="checkout-row">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatCurrency(shipping)
            )}
          </span>
        </div>
        
        {shipping === 0 && (
          <div className="text-sm text-green-600 mb-2">
            🎉 Free shipping on orders over $50!
          </div>
        )}
        
        <div className="checkout-row">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        
        <div className="checkout-row checkout-total">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        <button
          onClick={onCheckout}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors font-medium"
        >
          Proceed to Checkout
        </button>
        
        <button
          onClick={onClearCart}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
        >
          Clear Cart
        </button>
      </div>
      
      {/* Security badges */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure Checkout
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            SSL Encrypted
          </div>
        </div>
      </div>
      
      {/* Estimated delivery */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-center text-sm text-blue-800">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Estimated delivery: 3-5 business days</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
