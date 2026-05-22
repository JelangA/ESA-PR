import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  isLoading: boolean;
}

class MicrofrontendLoader extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    isLoading: true,
  };

  public componentDidMount() {
    // Simulate loading complete after mount
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 100);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isLoading: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Microfrontend ${this.props.name} failed to load:`, error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Auto-retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying ${this.props.name} (attempt ${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.setState({ hasError: false, isLoading: true });
        setTimeout(() => {
          this.setState({ isLoading: false });
        }, 1000);
      }, 2000);
    }
  }

  private handleManualRetry = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, isLoading: true });
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
  };

  public render() {
    const { hasError, isLoading } = this.state;
    const { children, name } = this.props;

    if (isLoading) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {name}...</p>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-red-50">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Failed to Load {name}
            </h2>
            <p className="text-red-700 mb-4 text-sm">
              The {name} module could not be loaded. This might be due to network issues or module configuration problems.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleManualRetry}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Retry Loading
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
}

export default MicrofrontendLoader;
