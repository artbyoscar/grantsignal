# Error Handling Quick Reference

## Summary

GrantSignal now has comprehensive error handling with:
- ✅ React Error Boundary component
- ✅ Global 500 error page
- ✅ Dashboard-specific error page
- ✅ Enhanced 404 page (already existed)
- ✅ tRPC error handling with toast notifications
- ✅ Offline detection and banner
- ✅ Form validation error components

## Quick Usage Guide

### 1. Wrap Components with Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 2. Form Validation Errors

```tsx
import { FormError, getInputErrorClass } from '@/components/ui/form-error'
import { cn } from '@/lib/utils'

<Input
  {...register('email')}
  className={cn(getInputErrorClass(!!errors.email))}
/>
<FormError message={errors.email?.message} />
```

### 3. API Error Handling

```tsx
// Automatic toast notifications for:
// - 401: Authentication required
// - 403: Access denied
// - 404: Not found
// - 400: Invalid request
// - 500+: Server error
// - Network errors: Connection error

const mutation = api.grants.create.useMutation({
  onSuccess: () => {
    toast.success('Grant created!')
  },
  // Error handling is automatic via tRPC provider
})
```

### 4. Detect Offline State

```tsx
import { useOnlineStatus } from '@/hooks/use-online-status'

const isOnline = useOnlineStatus()

<button disabled={!isOnline}>
  {isOnline ? 'Submit' : 'Offline'}
</button>
```

### 5. Page-Level Error States

```tsx
import { ErrorState } from '@/components/ui/error-state'

if (error) {
  return (
    <ErrorState
      title="Failed to load"
      message="Unable to fetch data. Please try again."
      onRetry={() => refetch()}
    />
  )
}
```

## Error Pages

### Global Error (500)
**Location:** `src/app/error.tsx`
- Catches all unhandled app errors
- Shows error details in development
- "Try Again" and "Go to Dashboard" buttons

### Dashboard Error
**Location:** `src/app/(dashboard)/error.tsx`
- Catches errors within dashboard layout
- "Go Back", "Try Again", and "Dashboard" buttons

### Not Found (404)
**Location:** `src/app/not-found.tsx`
- Beautiful branded 404 page
- Search input and quick links
- Already existed, no changes made

## Testing

### Test Error Boundary

Create a component that throws an error:

```tsx
function TestError() {
  throw new Error('Test error!')
}
```

### Test Offline State

In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling dropdown to "Offline"
4. Observe offline banner appears

### Test API Errors

```tsx
// Trigger different error types
const mutation = api.test.trigger401.useMutation() // Auth error
const mutation = api.test.trigger403.useMutation() // Permission error
const mutation = api.test.trigger404.useMutation() // Not found
const mutation = api.test.trigger500.useMutation() // Server error
```

## Files Created

```
src/
├── components/
│   ├── error-boundary.tsx          # React Error Boundary
│   ├── offline-banner.tsx          # Offline detection banner
│   └── ui/
│       ├── form-error.tsx          # Form validation errors
│       └── error-state.tsx         # Already existed
├── hooks/
│   └── use-online-status.ts        # Offline detection hook
├── app/
│   ├── error.tsx                   # Global error page
│   ├── not-found.tsx               # Already existed (404)
│   └── (dashboard)/
│       └── error.tsx               # Dashboard error page
└── trpc/
    └── react.tsx                   # Enhanced with error handling

docs/
├── error-handling.md               # Full documentation
└── ERROR_HANDLING_QUICK_REFERENCE.md  # This file
```

## Best Practices

1. **Always wrap major sections with ErrorBoundary** - Don't let errors crash the entire app
2. **Use toast for transient errors** - API errors, validation errors
3. **Use full-page errors for critical failures** - Page load errors, auth failures
4. **Show inline errors for forms** - Field-level validation
5. **Preserve user input on error** - Don't clear forms when validation fails
6. **Provide clear recovery actions** - "Try Again", "Go Back", "Contact Support"

## What's Automatic

The following error handling is **automatic** and requires no additional code:

✅ tRPC API errors show toast notifications
✅ Offline banner appears when connection is lost
✅ Global error page catches unhandled errors
✅ Dashboard error page catches dashboard errors
✅ 404 page shows for non-existent routes
✅ Retry logic for failed API requests (up to 2 retries)

## Future Enhancements

- [ ] Integrate Sentry or other error tracking service
- [ ] Add offline queue for mutations
- [ ] Implement automatic error recovery strategies
- [ ] Add error analytics dashboard
- [ ] Create error templates for common scenarios
