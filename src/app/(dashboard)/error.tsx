'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Dashboard Error Page
 * This catches errors within the dashboard layout
 * Provides context-specific recovery options for dashboard errors
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to console or error tracking service
    console.error('Dashboard error:', error)

    // TODO: Send to error tracking service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: { errorBoundary: 'dashboard' },
    //     extra: { digest: error.digest },
    //   })
    // }
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Error icon with glow effect */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
            <div className="relative bg-red-900/20 border border-red-800 rounded-full p-6">
              <AlertTriangle className="w-16 h-16 text-red-400" />
            </div>
          </div>
        </div>

        {/* Error content */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            We encountered an error while loading this page. Please try again or go back to the dashboard.
          </p>
        </div>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <summary className="text-sm font-medium text-slate-300 cursor-pointer hover:text-white mb-3">
              Error Details (Development Only)
            </summary>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Message:</div>
                <div className="text-sm font-mono text-red-400 break-all bg-slate-950 p-3 rounded border border-slate-800">
                  {error.message || 'No error message available'}
                </div>
              </div>
              {error.digest && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Digest:</div>
                  <div className="text-sm font-mono text-slate-500 break-all bg-slate-950 p-3 rounded border border-slate-800">
                    {error.digest}
                  </div>
                </div>
              )}
              {error.stack && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Stack Trace:</div>
                  <pre className="text-xs font-mono text-slate-500 overflow-auto max-h-60 whitespace-pre-wrap bg-slate-950 p-3 rounded border border-slate-800">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="border-slate-700 hover:bg-slate-800 gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-700 hover:bg-slate-800 gap-2"
          >
            <Link href="/dashboard">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Support link */}
        <p className="text-sm text-slate-500 text-center">
          If this problem persists,{' '}
          <Link href="/support" className="text-blue-400 hover:text-blue-300 underline">
            contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
