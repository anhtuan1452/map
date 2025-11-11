import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            border: '2px solid #e74c3c'
          }}>
            <h2 style={{ 
              color: '#e74c3c', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '30px' }}>⚠️</span>
              Đã xảy ra lỗi
            </h2>
            
            <div style={{
              backgroundColor: '#2c2c2c',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '14px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <strong>Error:</strong>
              <pre style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.toString()}
              </pre>
              
              {this.state.errorInfo && (
                <>
                  <strong>Stack Trace:</strong>
                  <pre style={{ margin: '10px 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Thử lại
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🔃 Tải lại trang
              </button>
            </div>

            <p style={{ 
              marginTop: '20px', 
              fontSize: '14px', 
              color: '#95a5a6',
              textAlign: 'center'
            }}>
              Nếu lỗi vẫn tiếp tục, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
