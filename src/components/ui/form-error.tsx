import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormErrorProps {
  message?: string
  className?: string
  /** Animate the error message appearance */
  animate?: boolean
  /** Unique ID for linking to form inputs via aria-describedby */
  id?: string
}

/**
 * Form Error Component
 * Displays inline error messages for form fields
 *
 * Accessibility Features:
 * - role="alert" for screen reader announcement
 * - aria-live="assertive" for dynamic error updates
 * - Supports aria-describedby linking via id prop
 *
 * Usage:
 * <Input aria-describedby="email-error" aria-invalid={!!errors.email} />
 * <FormError id="email-error" message={errors.email?.message} />
 */
export function FormError({ message, className, animate = true, id }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      id={id}
      className={cn(
        'flex items-center gap-2 text-red-400 text-sm mt-1.5',
        animate && 'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

interface FormErrorSummaryProps {
  errors: string[]
  title?: string
  className?: string
}

/**
 * Form Error Summary Component
 * Displays a summary of all form errors at the top of the form
 *
 * Usage:
 * <FormErrorSummary
 *   errors={['Email is required', 'Password must be at least 8 characters']}
 * />
 */
export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className,
}: FormErrorSummaryProps) {
  if (!errors.length) return null

  return (
    <div
      className={cn(
        'bg-red-900/20 border border-red-800 rounded-lg p-4',
        'animate-in fade-in-0 slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-300 mb-2" id="form-error-summary-title">{title}</h3>
          <ul className="space-y-1" aria-labelledby="form-error-summary-title">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-400">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Input Error Wrapper
 * Adds a red border to inputs when there's an error
 *
 * Usage:
 * <Input
 *   {...register('email')}
 *   className={cn(errors.email && 'border-red-500 focus-visible:ring-red-500')}
 * />
 * <FormError message={errors.email?.message} />
 */
export function getInputErrorClass(hasError?: boolean) {
  return hasError ? 'border-red-500 focus-visible:ring-red-500' : ''
}

/**
 * Form Field Wrapper Component
 * Combines label, input slot, and error message
 *
 * Accessibility Features:
 * - Label linked to input via htmlFor and inputId
 * - Required fields marked with aria-required
 * - Error messages linked via aria-describedby
 * - Description linked via aria-describedby
 *
 * Usage:
 * <FormField label="Email" error={errors.email?.message} required inputId="email-input">
 *   <Input id="email-input" type="email" {...register('email')} />
 * </FormField>
 */
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
  className?: string
  children: React.ReactNode
  /** ID of the input element for label association */
  inputId?: string
}

export function FormField({
  label,
  error,
  required,
  description,
  className,
  children,
  inputId,
}: FormFieldProps) {
  const errorId = inputId ? `${inputId}-error` : undefined
  const descriptionId = inputId && description ? `${inputId}-description` : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-200"
      >
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-hidden="true">*</span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {description && (
        <p id={descriptionId} className="text-xs text-slate-400">{description}</p>
      )}
      {children}
      <FormError id={errorId} message={error} />
    </div>
  )
}

/**
 * Network Error Banner
 * Displays a prominent error when network connection fails
 */
interface NetworkErrorBannerProps {
  onRetry?: () => void
  className?: string
}

export function NetworkErrorBanner({ onRetry, className }: NetworkErrorBannerProps) {
  return (
    <div
      className={cn(
        'bg-red-900/30 border border-red-800 rounded-lg p-4',
        'animate-in fade-in-0 slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-300">
            Unable to connect
          </h4>
          <p className="text-sm text-red-400/80">
            Check your internet connection and try again.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-300 hover:text-red-200 underline focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-900/30 rounded"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
