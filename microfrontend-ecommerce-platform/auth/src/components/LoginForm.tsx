import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail } from '@microfrontend-ecommerce/shared';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { state, login, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
  });

  const demoCredentials = [
    { username: 'mor_2314', password: '83r5^_' },
    { username: 'kevinryan', password: 'kev02937@' },
    { username: 'donero', password: 'ewedon' },
    { username: 'derek', password: 'jklg*_56' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (state.error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      username: '',
      password: '',
    };

    if (!formData.username) {
      errors.username = 'Username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const success = await login(formData);
    if (success) {
      // Small delay to show the updated header state
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect') || '/';
          window.location.href = redirect;
        }
      }, 1000);
    }
  };

  const handleDemoLogin = (credentials: { username: string; password: string }) => {
    setFormData(credentials);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm">{state.error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your username"
            required
          />
          {formErrors.username && (
            <p className="form-error">{formErrors.username}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your password"
            required
          />
          {formErrors.password && (
            <p className="form-error">{formErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={state.loading}
          className="auth-button"
        >
          {state.loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="demo-credentials">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Demo Credentials:</span>
          <span className="text-xs text-gray-500">Click to use</span>
        </div>
        {demoCredentials.map((cred, index) => (
          <div key={index} className="demo-credential-item">
            <button
              type="button"
              onClick={() => handleDemoLogin(cred)}
              className="text-xs text-left hover:text-primary-600 transition-colors"
            >
              <span className="font-mono">{cred.username}</span> / <span className="font-mono">{cred.password}</span>
            </button>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => copyToClipboard(cred.username)}
                className="copy-button"
                title="Copy username"
              >
                📋
              </button>
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-500 mt-2">
          These are test credentials from the Fake Store API
        </p>
      </div>

      <div className="divider mt-6">
        <span>Don't have an account?</span>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onToggleMode}
          className="auth-link"
        >
          Create new account
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
