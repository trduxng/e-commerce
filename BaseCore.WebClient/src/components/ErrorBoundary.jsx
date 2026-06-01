import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary">
          <i className="fa fa-triangle-exclamation"></i>
          <h1>Something went wrong</h1>
          <p>The page could not be displayed. Reload to try again.</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

