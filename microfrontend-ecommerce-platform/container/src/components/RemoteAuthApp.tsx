import React, { Suspense } from 'react';
import Loading from './Loading';

const AuthApp = React.lazy(() => 
  import('auth/App')
    .then(module => {
      return { default: module.default };
    })
    .catch(error => {
      console.error('Failed to load auth module:', error);
      return { default: () => <div>Failed to load Authentication</div> };
    })
);

const RemoteAuthApp: React.FC = () => {
  return (
    <Suspense fallback={<Loading message="Loading authentication..." />}>
      <AuthApp />
    </Suspense>
  );
};

export default RemoteAuthApp;
