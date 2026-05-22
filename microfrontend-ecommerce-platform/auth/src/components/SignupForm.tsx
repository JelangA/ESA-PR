import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail } from '@microfrontend-ecommerce/shared';

interface SignupFormProps {
  onToggleMode: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode }) => {
  const { state, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [success, setSuccess] = useState(false);

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
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    };

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Simulate signup process (in real app, this would call an API)
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
      onToggleMode(); // Switch back to login form
    }, 2000);
  };

  if (success) {
    return (
      <div className="auth-card text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created!</h2>
        <p className="text-gray-600 mb-6">
          Your account has been created successfully. You can now sign in with your credentials.
        </p>
        <div className="animate-pulse text-sm text-gray-500">
          Redirecting to sign in...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join us and start shopping</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="form-input"
              placeholder="First name"
              required
            />
            {formErrors.firstName && (
              <p className="form-error">{formErrors.firstName}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="form-input"
              placeholder="Last name"
              required
            />
            {formErrors.lastName && (
              <p className="form-error">{formErrors.lastName}</p>
            )}
          </div>
        </div>

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
            placeholder="Choose a username"
            required
          />
          {formErrors.username && (
            <p className="form-error">{formErrors.username}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="your@email.com"
            required
          />
          {formErrors.email && (
            <p className="form-error">{formErrors.email}</p>
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
            placeholder="Create a password"
            required
          />
          {formErrors.password && (
            <p className="form-error">{formErrors.password}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="Confirm your password"
            required
          />
          {formErrors.confirmPassword && (
            <p className="form-error">{formErrors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={state.loading}
          className="auth-button"
        >
          Create Account
        </button>
      </form>

      <div className="divider mt-6">
        <span>Already have an account?</span>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onToggleMode}
          className="auth-link"
        >
          Sign in instead
        </button>
      </div>

      {/* Terms and privacy */}
      <div className="mt-6 text-center text-xs text-gray-500">
        By creating an account, you agree to our{' '}
        <a href="#" className="auth-link">Terms of Service</a> and{' '}
        <a href="#" className="auth-link">Privacy Policy</a>
      </div>
    </div>
  );
};

export default SignupForm;
