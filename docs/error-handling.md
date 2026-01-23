# Error Handling Guide

This document provides an overview of the error handling system in GrantSignal.

## Components

### 1. Error Boundary (`src/components/error-boundary.tsx`)

Catches JavaScript errors in the component tree and displays a fallback UI.

**Usage:**

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

**With HOC:**

```tsx
import { withErrorBoundary } from '@/components/error-boundary'

const MyComponent = () => {
  // Component code
}

export default withErrorBoundary(MyComponent)
```

**Features:**
- Catches runtime errors in child components
- Shows user-friendly error message
- "Try Again" button to reset error state
- Displays error details in development mode
- Can be customized with `fallback` prop
- Optional `onError` callback for logging

### 2. Global Error Page (`src/app/error.tsx`)

Catches unhandled errors at the app level.

**Features:**
- Automatically receives `error` and `reset` props from Next.js
- Shows error details in development
- "Try Again" button to attempt recovery
- "Go to Dashboard" link for navigation
- Contact support link

### 3. Dashboard Error Page (`src/app/(dashboard)/error.tsx`)

Catches errors within the dashboard layout.

**Features:**
- Context-specific error handling for dashboard
- "Go Back" button to navigate to previous page
- Same error details and recovery options as global error page

### 4. 404 Not Found Page (`src/app/not-found.tsx`)

Custom 404 page with GrantSignal branding.

**Features:**
- Large decorative "404" text
- Search input for finding content
- Quick links to main sections
- "Go to Dashboard" button
- "Report this issue" link

## Error Handling Patterns

### API Errors (tRPC)

The tRPC provider automatically handles API errors with toast notifications:

```tsx
// Authentication errors (401)
toast.error('Authentication required')
// Redirects to sign-in

// Permission errors (403)
toast.error('Access denied')

// Not found errors (404)
toast.error('Not found')

// Validation errors (400)
toast.error('Invalid request')

// Server errors (500+)
toast.error('Server error')

// Network errors
toast.error('Connection error')
```

**Automatic retry logic:**
- Retries failed requests up to 2 times
- Does not retry on 401, 403, or 404 errors
- Exponential backoff for retries

### Form Errors

Use the `FormError` and `FormErrorSummary` components for form validation:

```tsx
import { FormError, FormErrorSummary, getInputErrorClass } from '@/components/ui/form-error'
import { cn } from '@/lib/utils'

function MyForm() {
  const { register, formState: { errors } } = useForm()

  return (
    <form>
      {/* Error summary at top */}
      <FormErrorSummary
        errors={[
          errors.email?.message,
          errors.password?.message,
        ].filter(Boolean)}
      />

      {/* Field with inline error */}
      <div>
        <Input
          {...register('email')}
          className={cn(getInputErrorClass(!!errors.email))}
        />
        <FormError message={errors.email?.message} />
      </div>
    </form>
  )
}
```

### Inline Errors

For smaller error displays within UI:

```tsx
import { InlineError } from '@/components/ui/error-state'

function MyComponent() {
  return (
    <InlineError
      message="Failed to load data"
      onRetry={() => refetch()}
    />
  )
}
```

### Page-Level Errors

For full-page error states:

```tsx
import { ErrorState } from '@/components/ui/error-state'

function MyPage() {
  if (error) {
    return (
      <ErrorState
        title="Failed to load grants"
        message="Unable to fetch grants. Please try again."
        onRetry={() => refetch()}
      />
    )
  }

  return <div>Content</div>
}
```

## Offline Detection

### OfflineBanner Component

Automatically shown when user goes offline:

```tsx
import { OfflineBanner } from '@/components/offline-banner'

// Already added to root layout
// Shows "You're offline" banner when connection is lost
// Shows "You're back online" briefly when connection is restored
```

### useOnlineStatus Hook

For conditional logic based on online status:

```tsx
import { useOnlineStatus } from '@/hooks/use-online-status'

function MyComponent() {
  const isOnline = useOnlineStatus()

  return (
    <button disabled={!isOnline}>
      {isOnline ? 'Submit' : 'Offline'}
    </button>
  )
}
```

## Best Practices

### 1. Error Boundaries

- Wrap major sections or routes with error boundaries
- Don't wrap the entire app in one boundary (use multiple for better granularity)
- Provide context-specific fallbacks when possible

### 2. User Feedback

- Always show user-friendly error messages (not technical details)
- Provide actionable recovery options ("Try Again", "Go Back")
- Use toast notifications for transient errors
- Use full-page errors for critical failures

### 3. Error Logging

- Log errors in development for debugging
- Send errors to monitoring service in production (e.g., Sentry)
- Include context (user ID, organization ID, route, etc.)

### 4. Form Validation

- Show inline errors below fields
- Use error summary at top for multiple errors
- Add red border to invalid fields
- Don't clear form on error (preserve user input)

### 5. Offline Handling

- Disable actions that require network when offline
- Show clear messaging about offline state
- Consider queuing actions for sync when back online

## Error Hierarchy

1. **Global Error** (`app/error.tsx`) - Catches all app errors
2. **Layout Error** (`app/(dashboard)/error.tsx`) - Catches errors in specific layouts
3. **Page Error** - Use Error Boundary for component-level errors
4. **API Error** - Handled by tRPC provider with toast notifications
5. **Form Error** - Inline validation errors

## Testing

### Trigger Error Boundary

```tsx
function BuggyComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Test error!')
  }

  return <button onClick={() => setShouldError(true)}>Trigger Error</button>
}
```

### Test Offline State

In browser DevTools:
1. Open Network tab
2. Set throttling to "Offline"
3. Observe offline banner and disabled actions

### Test API Errors

```tsx
const mutation = api.grants.create.useMutation({
  onError: (error) => {
    // Toast notification will be shown automatically
    console.error(error)
  },
})
```

## Future Enhancements

- [ ] Integrate error tracking service (Sentry)
- [ ] Add error recovery strategies (automatic retry, fallback data)
- [ ] Implement offline queue for mutations
- [ ] Add error analytics and monitoring
- [ ] Create error templates for common scenarios
