import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'Failed to load data',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="bg-red-900/20 border border-red-800 rounded-full p-4 mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

// Inline error variant for smaller spaces
interface InlineErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function InlineError({ message, onRetry, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="text-red-300 text-sm flex-1">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="flex-shrink-0">
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      )}
    </div>
  )
}
