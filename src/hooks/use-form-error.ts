'use client'

import { useState, useCallback } from 'react'

export interface FieldError {
  field: string
  message: string
}

export interface FormErrorState {
  errors: Record<string, string>
  globalError: string | null
  hasErrors: boolean
}

/**
 * useFormError Hook
 * Manages form error state with support for field-level and global errors
 *
 * Features:
 * - Field-level error management
 * - Global form error support
 * - Input class helper for red borders
 * - Error clearing on field change
 * - tRPC error parsing
 *
 * Usage:
 * ```tsx
 * const { errors, setFieldError, getInputClassName, clearField, reset } = useFormError()
 *
 * <Input
 *   className={getInputClassName('email')}
 *   onChange={(e) => {
 *     clearField('email')
 *     setEmail(e.target.value)
 *   }}
 * />
 * <FormError message={errors.email} />
 * ```
 */
export function useFormError() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Set a single field error
  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  // Set multiple field errors at once
  const setFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
    setErrors(prev => ({ ...prev, ...fieldErrors }))
  }, [])

  // Clear a single field error
  const clearField = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Clear all errors
  const reset = useCallback(() => {
    setErrors({})
    setGlobalError(null)
  }, [])

  // Get the error for a specific field
  const getError = useCallback((field: string): string | undefined => {
    return errors[field]
  }, [errors])

  // Check if a field has an error
  const hasError = useCallback((field: string): boolean => {
    return !!errors[field]
  }, [errors])

  // Get className for input with error state
  const getInputClassName = useCallback((field: string, baseClass = ''): string => {
    const errorClass = errors[field]
      ? 'border-red-500 focus-visible:ring-red-500'
      : ''
    return `${baseClass} ${errorClass}`.trim()
  }, [errors])

  // Get all errors as array (useful for FormErrorSummary)
  const getErrorList = useCallback((): string[] => {
    const errorList = Object.values(errors)
    if (globalError) {
      errorList.unshift(globalError)
    }
    return errorList
  }, [errors, globalError])

  // Parse and set errors from tRPC error response
  const setFromTRPCError = useCallback((error: unknown) => {
    if (!error || typeof error !== 'object') {
      setGlobalError('An unexpected error occurred')
      return
    }

    const err = error as { message?: string; data?: { zodError?: { fieldErrors?: Record<string, string[]> } } }

    // Check for Zod validation errors from tRPC
    if (err.data?.zodError?.fieldErrors) {
      const zodErrors = err.data.zodError.fieldErrors
      const fieldErrors: Record<string, string> = {}

      for (const [field, messages] of Object.entries(zodErrors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0]
        }
      }

      setFieldErrors(fieldErrors)
      return
    }

    // Fallback to global error message
    setGlobalError(err.message || 'An unexpected error occurred')
  }, [setFieldErrors])

  // Parse and set errors from standard API error response
  const setFromAPIError = useCallback((error: {
    errors?: FieldError[]
    message?: string
  }) => {
    if (error.errors && Array.isArray(error.errors)) {
      const fieldErrors: Record<string, string> = {}
      error.errors.forEach(({ field, message }) => {
        fieldErrors[field] = message
      })
      setFieldErrors(fieldErrors)
    } else if (error.message) {
      setGlobalError(error.message)
    }
  }, [setFieldErrors])

  return {
    // State
    errors,
    globalError,
    hasErrors: Object.keys(errors).length > 0 || !!globalError,

    // Field operations
    setFieldError,
    setFieldErrors,
    clearField,
    getError,
    hasError,

    // Global error operations
    setGlobalError,
    clearGlobalError: () => setGlobalError(null),

    // Helpers
    getInputClassName,
    getErrorList,
    reset,

    // Error parsing
    setFromTRPCError,
    setFromAPIError,
  }
}

/**
 * Form field state type for controlled inputs
 */
export interface FormField<T> {
  value: T
  error?: string
  touched: boolean
}

/**
 * useFormField Hook
 * Manages individual form field state with validation
 *
 * Usage:
 * ```tsx
 * const email = useFormField('', validateEmail)
 *
 * <Input
 *   value={email.value}
 *   onChange={email.onChange}
 *   onBlur={email.onBlur}
 *   className={email.hasError ? 'border-red-500' : ''}
 * />
 * <FormError message={email.error} />
 * ```
 */
export function useFormField<T>(
  initialValue: T,
  validate?: (value: T) => string | undefined
) {
  const [value, setValue] = useState<T>(initialValue)
  const [error, setError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)

  const onChange = useCallback((newValue: T) => {
    setValue(newValue)
    // Clear error when user starts typing
    if (error) {
      setError(undefined)
    }
  }, [error])

  const onBlur = useCallback(() => {
    setTouched(true)
    if (validate) {
      const validationError = validate(value)
      setError(validationError)
    }
  }, [value, validate])

  const runValidation = useCallback(() => {
    if (validate) {
      const validationError = validate(value)
      setError(validationError)
      return !validationError
    }
    return true
  }, [value, validate])

  const reset = useCallback(() => {
    setValue(initialValue)
    setError(undefined)
    setTouched(false)
  }, [initialValue])

  return {
    value,
    error,
    touched,
    hasError: !!error,
    showError: touched && !!error,

    setValue,
    setError,
    onChange,
    onBlur,

    validate: runValidation,
    reset,

    // Input props helper
    inputProps: {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value as unknown as T),
      onBlur,
    },
  }
}

// Common validation functions
export const validators = {
  required: (message = 'This field is required') => (value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return message
    }
    return undefined
  },

  email: (message = 'Please enter a valid email address') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return message
    }
    return undefined
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`
    }
    return undefined
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`
    }
    return undefined
  },

  pattern: (regex: RegExp, message = 'Invalid format') => (value: string) => {
    if (value && !regex.test(value)) {
      return message
    }
    return undefined
  },

  // Combine multiple validators
  compose: (...validators: Array<(value: unknown) => string | undefined>) =>
    (value: unknown): string | undefined => {
      for (const validator of validators) {
        const error = validator(value)
        if (error) return error
      }
      return undefined
    },
}
