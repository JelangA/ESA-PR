import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAuthRxJS } from './hooks/useRxJSStore';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProfileView from './components/ProfileView';
import './index.css';

// Auth content component
const AuthContent: React.FC = () => {
  const { state } = useAuth();
  const rxjsAuth = useAuthRxJS();
  const [isSignup, setIsSignup] = useState(false);

  // Check authentication from RxJS Global Store first, then fallback to local state
  const isAuthenticated = rxjsAuth.isAuthenticated || state.isAuthenticated;
  const currentUser = rxjsAuth.user || state.user;

  // If user is authenticated, show profile
  if (isAuthenticated && currentUser) {
    return <ProfileView />;
  }

  // Show auth forms
  return (
    <div className="auth-container">
      {isSignup ? (
        <SignupForm onToggleMode={() => setIsSignup(false)} />
      ) : (
        <LoginForm onToggleMode={() => setIsSignup(true)} />
      )}
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AuthContent />
      </div>
    </AuthProvider>
  );
};

export default App;
