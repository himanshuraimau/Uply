'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Enhanced error logging
    console.error('🚨 Error boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to error tracking service (if available)
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="border-4 border-border bg-card max-w-md w-full">
            <CardHeader className="border-b-4 border-border text-center">
              <div className="w-16 h-16 bg-destructive border-4 border-border mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
                SOMETHING WENT WRONG
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              {(() => {
                const isNetworkError = this.state.error?.message.includes('fetch') || 
                                      this.state.error?.message.includes('network');
                const isChunkError = this.state.error?.message.includes('Loading chunk') ||
                                    this.state.error?.message.includes('ChunkLoadError');

                if (isChunkError) {
                  return (
                    <p className="text-muted-foreground font-sans">
                      The application needs to be refreshed to load the latest version.
                    </p>
                  );
                } else if (isNetworkError) {
                  return (
                    <p className="text-muted-foreground font-sans">
                      A network error occurred. Please check your connection and try again.
                    </p>
                  );
                } else {
                  return (
                    <p className="text-muted-foreground font-sans">
                      An unexpected error occurred. This has been logged and will be investigated.
                    </p>
                  );
                }
              })()}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left p-4 bg-muted border-2 border-border">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                {this.state.retryCount < 3 && !this.state.error?.message.includes('Loading chunk') && (
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="border-2 border-border font-bold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    TRY AGAIN
                  </Button>
                )}
                
                <Button
                  onClick={() => window.location.reload()}
                  className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  REFRESH PAGE
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}