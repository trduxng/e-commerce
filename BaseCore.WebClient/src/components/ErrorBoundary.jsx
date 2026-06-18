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
          <h1>Đã xảy ra lỗi</h1>
          <p>Không thể hiển thị trang này. Vui lòng tải lại để thử lại.</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

