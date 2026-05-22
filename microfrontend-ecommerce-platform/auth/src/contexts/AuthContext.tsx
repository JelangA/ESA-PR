import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  LoginCredentials,
  authApi,
  storage,
} from "@microfrontend-ecommerce/shared";

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Auth context type
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  // Load auth state from storage on mount
  useEffect(() => {
    const savedToken = storage.get("authToken");
    const savedUser = storage.get("authUser");

    if (savedToken && savedUser) {
      setState((prev) => ({
        ...prev,
        user: savedUser,
        token: savedToken,
        isAuthenticated: true,
      }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const authResponse = await authApi.login(credentials);

      // For demo purposes, we'll create a mock user based on the credentials
      // In a real app, you'd get the user data from the API response
      const mockUser: User = {
        id: 1,
        email: credentials.username,
        username: credentials.username,
        password: "", // Don't store password
        name: {
          firstname: credentials.username.split("@")[0] || "User",
          lastname: "Demo",
        },
        address: {
          city: "Demo City",
          street: "123 Demo St",
          number: 1,
          zipcode: "12345",
          geolocation: {
            lat: "0",
            long: "0",
          },
        },
        phone: "555-0123",
      };

      // Save to storage
      storage.set("authToken", authResponse.token);
      storage.set("authUser", mockUser);

      setState((prev) => ({
        ...prev,
        user: mockUser,
        token: authResponse.token,
        isAuthenticated: true,
        loading: false,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  const logout = () => {
    // Clear storage
    storage.remove("authToken");
    storage.remove("authUser");

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });

    // Navigate to home page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
