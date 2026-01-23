import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string
  className?: string
}

/**
 * Form Error Component
 * Displays inline error messages for form fields
 *
 * Usage:
 * <FormError message={errors.email?.message} />
 */
export function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null

  return (
    <div className={`flex items-center gap-2 text-red-400 text-sm mt-1 ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
  className = '',
}: FormErrorSummaryProps) {
  if (!errors.length) return null

  return (
    <div className={`bg-red-900/20 border border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-300 mb-2">{title}</h3>
          <ul className="space-y-1">
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
