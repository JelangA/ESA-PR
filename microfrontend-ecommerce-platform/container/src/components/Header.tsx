import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContextRxJS";

const Header: React.FC = () => {
  const { state, logout } = useApp();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-primary-600 border-primary-600"
      : "text-gray-600 hover:text-primary-600";
  };

  return (
    <>
      <header className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold text-gray-900">
                MicroStore
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden space-x-8 md:flex">
              <Link
                to="/"
                className={`pb-2 border-b-2 border-transparent transition-colors ${isActive(
                  "/"
                )}`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`pb-2 border-b-2 border-transparent transition-colors ${isActive(
                  "/products"
                )}`}
              >
                Products
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 transition-colors hover:text-primary-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
                {state.cartCount > 0 && (
                  <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-2 -right-2">
                    {state.cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {state.isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth"
                    className="flex items-center px-3 py-2 space-x-2 transition-colors rounded-md hover:bg-gray-50"
                    title="View Profile"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                      <span className="text-sm font-medium text-primary-600">
                        {(state.user?.name?.firstname || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">
                      {state.user?.name?.firstname || "User"}
                    </span>
                  </Link>
                  <button
                    onClick={async (e) => {
                      try {
                        e.preventDefault();
                        e.stopPropagation();
                        await logout();
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Fallback redirect
                        if (typeof window !== 'undefined') {
                          window.location.href = '/';
                        }
                      }
                    }}
                    className="flex items-center px-4 py-2 space-x-1 text-sm font-medium text-white transition-colors bg-red-500 rounded-md hover:bg-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center px-4 py-2 space-x-1 text-sm font-medium text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="p-2 text-gray-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
