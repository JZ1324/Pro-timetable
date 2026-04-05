import React from 'react';
import { logError } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error, info) {
    logError(error, { componentStack: info?.componentStack || '' });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.message}</p>
          <button type="button" onClick={this.handleReload}>Reload App</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
