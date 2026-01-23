'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console or error tracking service
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // TODO: Send to error tracking service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Error icon with glow effect */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-red-900/20 border border-red-800 rounded-full p-6">
                  <AlertTriangle className="w-16 h-16 text-red-400" />
                </div>
              </div>
            </div>

            {/* Error message */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">
                Something went wrong
              </h2>
              <p className="text-slate-400 text-lg">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <summary className="text-sm font-medium text-slate-300 cursor-pointer hover:text-white">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono text-red-400 break-all">
                    {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="text-xs font-mono text-slate-500 overflow-auto max-h-40 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={this.handleReset}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-700 hover:bg-slate-800 gap-2"
              >
                <Link href="/dashboard">
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Support link */}
            <p className="text-sm text-slate-500">
              If this problem persists,{' '}
              <Link href="/support" className="text-blue-400 hover:text-blue-300 underline">
                contact support
              </Link>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Boundary Hook (for functional components)
 * Note: React doesn't have built-in error boundary hooks yet,
 * so this is a wrapper to make it easier to use in functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
