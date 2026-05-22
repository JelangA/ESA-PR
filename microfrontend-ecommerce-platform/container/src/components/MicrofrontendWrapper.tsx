import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Loading from './Loading';

interface MicrofrontendWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

const MicrofrontendWrapper: React.FC<MicrofrontendWrapperProps> = ({
  children,
  fallback,
  loadingMessage = 'Loading microfrontend...',
}) => {
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={<Loading message={loadingMessage} />}>
        <div className="microfrontend-container">
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default MicrofrontendWrapper;
