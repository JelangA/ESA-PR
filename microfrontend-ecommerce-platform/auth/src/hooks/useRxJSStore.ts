import { useState, useEffect } from 'react';

// Get global store from window (set by container)
declare global {
  interface Window {
    __GLOBAL_STORE__: any;
  }
}

/**
 * Auth-specific hook to get user state from RxJS Global Store
 */
export const useAuthRxJS = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to get global store from window
    const globalStore = window.__GLOBAL_STORE__;
    if (!globalStore) {
      return;
    }

    // Subscribe to user changes
    const subscription = globalStore.state$.subscribe((state: any) => {
      setUser(state.user);
      setLoading(state.loading);
      setError(state.error);
    });

    // Get initial state
    const currentState = globalStore.getState();
    setUser(currentState.user);
    setLoading(currentState.loading);
    setError(currentState.error);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated: !!user,
    user,
    loading,
    error,
  };
};
