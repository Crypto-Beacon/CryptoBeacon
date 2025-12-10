import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <div className="bg-red-900/20 border border-red-500 rounded p-6 max-w-lg w-full">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                        <details className="whitespace-pre-wrap text-gray-300">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
