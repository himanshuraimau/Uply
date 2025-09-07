'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

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
              <p className="text-muted-foreground font-sans">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left p-4 bg-muted border-2 border-border">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                REFRESH PAGE
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}