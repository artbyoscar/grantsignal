'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Global Error Page (500)
 * This catches errors in the root layout and any child segments
 * Automatically receives error and reset props from Next.js
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console or error tracking service
    console.error('Global error:', error)

    // TODO: Send to error tracking service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: { errorBoundary: 'global' },
    //     extra: { digest: error.digest },
    //   })
    // }
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
          {/* Background ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px]" />
          </div>

          {/* Main content */}
          <div className="relative z-10 max-w-2xl w-full space-y-8 text-center">
            {/* Error illustration */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                <div className="relative bg-red-900/20 border border-red-800 rounded-full p-8">
                  <AlertTriangle className="w-20 h-20 text-red-400" />
                </div>
              </div>
            </div>

            {/* Error content */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white">
                Something went wrong
              </h1>
              <p className="text-xl text-slate-400 max-w-lg mx-auto">
                We're working on fixing this. Please try again or contact support if the problem persists.
              </p>
            </div>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-slate-900/50 border border-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                onClick={reset}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-700 hover:bg-slate-800 gap-2"
              >
                <Link href="/dashboard">
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Contact support */}
            <div className="pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500 mb-3">
                If this problem persists, please contact our support team
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white gap-2"
              >
                <Link href="/support">
                  <Mail className="w-4 h-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>

          {/* GrantSignal logo in bottom left */}
          <div className="absolute bottom-8 left-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <div className="w-4 h-4 border-2 border-white rounded-sm" />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                GrantSignal
              </span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
