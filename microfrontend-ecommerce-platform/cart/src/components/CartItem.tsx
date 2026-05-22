import React from 'react';
import { CartItemWithProduct } from '../contexts/CartContext';
import { formatCurrency } from '@microfrontend-ecommerce/shared';

interface CartItemProps {
  item: CartItemWithProduct;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const { product, quantity, productId } = item;

  if (!product) {
    return (
      <div className="cart-item animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjRmNGY0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIwLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5OTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  };

  return (
    <div className="cart-item">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <img
          src={product.image}
          alt={product.title}
          className="cart-item-image"
          onError={handleImageError}
        />

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {product.title}
              </h3>
              <p className="text-sm text-gray-500 capitalize mt-1">
                {product.category}
              </p>
              <p className="text-lg font-semibold text-primary-600 mt-2">
                {formatCurrency(product.price)}
              </p>
            </div>
            
            {/* Remove Button */}
            <button
              onClick={() => onRemove(productId)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quantity Controls and Subtotal */}
          <div className="flex items-center justify-between mt-4">
            <div className="quantity-control">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="quantity-button"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value);
                  if (!isNaN(newQuantity) && newQuantity >= 1) {
                    handleQuantityChange(newQuantity);
                  }
                }}
                className="quantity-input"
                min="1"
                max="99"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="quantity-button"
              >
                +
              </button>
            </div>
            
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(product.price * quantity)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
