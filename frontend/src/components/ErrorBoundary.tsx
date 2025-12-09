// React Error Boundary Component
// Catches JavaScript errors in child components and displays fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error details:', {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
            });
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: "'Space Grotesk', sans-serif",
                }}>
                    <div style={{
                        background: '#FEE2E2',
                        border: '3px solid #EF4444',
                        borderRadius: '20px',
                        padding: '2rem',
                        maxWidth: '500px',
                        boxShadow: '6px 6px 0px #000',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            marginBottom: '0.5rem',
                            color: '#991B1B',
                        }}>
                            Oops! Something went wrong
                        </h2>
                        <p style={{
                            color: '#7F1D1D',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                        }}>
                            Don't worry, your data is safe. Try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                textAlign: 'left',
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: '#FEF2F2',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                                    Error Details (Dev Only)
                                </summary>
                                <pre style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    marginTop: '0.5rem',
                                }}>
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleRetry}
                                style={{
                                    background: '#000',
                                    color: '#fff',
                                    border: '2px solid #000',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'Space Grotesk', sans-serif",
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    background: '#fff',
                                    color: '#000',
                                    border: '2px solid #000',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'Space Grotesk', sans-serif",
                                }}
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
