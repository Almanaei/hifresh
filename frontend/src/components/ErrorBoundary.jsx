import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ErrorBoundary.css';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContent 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          onRetry={this.handleRetry}
          isDarkMode={this.props.isDarkMode}
        />
      );
    }

    return this.props.children;
  }
}

// Separate functional component for the error content
function ErrorContent({ error, errorInfo, onRetry, isDarkMode }) {
  return (
    <div className={`error-boundary ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h1>Oops! Something went wrong</h1>
        <p>We're sorry for the inconvenience. Please try again.</p>
        <button onClick={onRetry} className="retry-button">
          <span className="button-icon">🔄</span>
          Retry
        </button>
        {process.env.NODE_ENV === 'development' && error && (
          <div className="error-details">
            <div className="error-message">
              {error.toString()}
            </div>
            <div className="stack-trace">
              <h3>Stack Trace:</h3>
              <pre>{errorInfo?.componentStack}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component to access theme context
function ErrorBoundary(props) {
  const { isDarkMode } = useTheme();
  return <ErrorBoundaryClass {...props} isDarkMode={isDarkMode} />;
}

export default ErrorBoundary; 