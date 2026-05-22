import React, { Suspense } from 'react';
import Loading from './Loading';

const CartApp = React.lazy(() => 
  import('cart/App')
    .then(module => {
      return { default: module.default };
    })
    .catch(error => {
      console.error('Failed to load cart module:', error);
      return { default: () => <div>Failed to load Cart</div> };
    })
);

const RemoteCartApp: React.FC = () => {
  return (
    <Suspense fallback={<Loading message="Loading cart..." />}>
      <CartApp />
    </Suspense>
  );
};

export default RemoteCartApp;
