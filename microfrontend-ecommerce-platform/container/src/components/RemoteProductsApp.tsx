import React, { Suspense } from 'react';
import Loading from './Loading';

const ProductsApp = React.lazy(() => 
  import('products/App')
    .then(module => {
      return { default: module.default };
    })
    .catch(error => {
      console.error('Failed to load products module:', error);
      return { default: () => <div>Failed to load Products</div> };
    })
);

const showDebugBoxes = false; // Set to false to hide debug boxes

const RemoteProductsApp: React.FC = () => {
  React.useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div>
      {showDebugBoxes && (
        <div style={{ padding: '10px', background: '#e3f2fd', border: '1px solid #1976d2', margin: '10px 0' }}>
          <strong>🔍 RemoteProductsApp Debug:</strong> Products microfrontend wrapper mounted
        </div>
      )}
      <Suspense fallback={
        <div>
          <Loading message="Loading products..." />
          <div style={{ padding: '10px', background: '#fff3e0', border: '1px solid #f57c00' }}>
            <strong>⏳ Debug:</strong> Products module is loading via Module Federation...
          </div>
        </div>
      }>
        <ProductsApp />
      </Suspense>
    </div>
  );
};

export default RemoteProductsApp;
