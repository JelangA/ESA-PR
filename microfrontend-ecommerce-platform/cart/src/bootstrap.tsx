import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Module Federation type declaration
declare global {
  interface Window {
    __POWERED_BY_MODULE_FEDERATION__?: boolean;
  }
}

// Mount the app only if running standalone
if (!window.__POWERED_BY_MODULE_FEDERATION__) {
  const root = ReactDOM.createRoot(
    document.getElementById('cart-root') as HTMLElement
  );

  root.render(
    // Temporarily disable StrictMode for microfrontend development
    <App />
  );
} else {
  // When used as microfrontend, set flag to prevent duplicate mounting

}

export default App;
