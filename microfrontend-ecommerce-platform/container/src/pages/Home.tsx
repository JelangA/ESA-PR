import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const features = [
    {
      title: 'Microfrontend Architecture',
      description: 'Built with independent microfrontends using React and Vue.js',
      icon: '🏗️',
    },
    {
      title: 'Product Catalog',
      description: 'Browse through our extensive product collection with various categories',
      icon: '📦',
    },
    {
      title: 'Shopping Cart',
      description: 'Add items to cart and manage your selections easily',
      icon: '🛒',
    },
    {
      title: 'User Authentication',
      description: 'Secure login and user management system',
      icon: '🔐',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to MicroStore
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A modern e-commerce platform built with microfrontend architecture,
          showcasing the power of React and Vue.js working together seamlessly.
        </p>
        <div className="space-x-4">
          <Link
            to="/products"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-block"
          >
            Shop Now
          </Link>
          <Link
            to="/auth"
            className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-block"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Architecture overview */}
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Microfrontend Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-lg mb-4">
              <span className="text-2xl">⚛️</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Container App (React)</h3>
            <p className="text-gray-600 text-sm">
              Main shell application orchestrating all microfrontends
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-lg mb-4">
              <span className="text-2xl">🟢</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Products (Vue.js)</h3>
            <p className="text-gray-600 text-sm">
              Product catalog and details built with Vue.js
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-lg mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Cart & Auth (React)</h3>
            <p className="text-gray-600 text-sm">
              Shopping cart and authentication services
            </p>
          </div>
        </div>
      </div>

      {/* Clean footer section */}
    </div>
  );
};

export default Home;
