import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex h-screen w-full flex-col items-center justify-center space-y-8 bg-background p-4 text-center animate-in fade-in duration-500">

                    {/* Visual Icon */}
                    <div className="relative h-24 w-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-destructive/10 rounded-full animate-ping opacity-20" />
                        <div className="absolute inset-2 bg-destructive/20 rounded-full" />
                        <AlertTriangle className="h-10 w-10 text-destructive relative z-10" />
                    </div>

                    <div className="space-y-3 max-w-md">
                        <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                            System Error
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Something went wrong while rendering this page. The application has caught the error to prevent a crash.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                            size="lg"
                            className="h-11 px-8 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /></svg>
                            Reload Page
                        </Button>
                        <Button
                            onClick={this.handleRetry}
                            variant="outline"
                            size="lg"
                            className="h-11 px-8 rounded-full bg-background border-border hover:bg-muted transition-all active:scale-95"
                        >
                            Try Again
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-8 w-full max-w-2xl rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-left shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 text-destructive mb-3 font-semibold text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Error Stack (Dev Only)
                            </div>
                            <pre className="font-mono text-xs text-destructive/80 overflow-auto max-h-60 whitespace-pre-wrap break-all custom-scrollbar">
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
