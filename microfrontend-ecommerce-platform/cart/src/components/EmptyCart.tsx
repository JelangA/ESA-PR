import React from 'react';

const EmptyCart: React.FC = () => {
  const handleShopNow = () => {
    // Navigate to products page
    // If we're in a microfrontend environment, try to navigate using window location
    if (typeof window !== 'undefined') {
      window.location.href = '/products';
    }
  };

  return (
    <div className="empty-cart">
      <div className="empty-cart-icon">🛒</div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Looks like you haven't added any items to your cart yet. 
        Start shopping to fill it up!
      </p>
      
      <button
        onClick={handleShopNow}
        className="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium"
      >
        Start Shopping
      </button>
      
      {/* Featured suggestions */}
      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Popular Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { name: 'Electronics', icon: '📱', category: 'electronics' },
            { name: 'Clothing', icon: '👕', category: "men's clothing" },
            { name: 'Jewelry', icon: '💍', category: 'jewelery' },
            { name: 'Women\'s', icon: '👗', category: "women's clothing" },
          ].map((cat) => (
            <button
              key={cat.category}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/products/category/${cat.category}`;
                }
              }}
              className="p-4 text-center bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium text-gray-900">{cat.name}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Shopping benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-3xl mb-3">🚚</div>
          <h4 className="font-medium text-gray-900 mb-2">Free Shipping</h4>
          <p className="text-sm text-gray-600">On orders over $50</p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-3">↩️</div>
          <h4 className="font-medium text-gray-900 mb-2">Easy Returns</h4>
          <p className="text-sm text-gray-600">30-day return policy</p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="font-medium text-gray-900 mb-2">Secure Payment</h4>
          <p className="text-sm text-gray-600">Your data is protected</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
