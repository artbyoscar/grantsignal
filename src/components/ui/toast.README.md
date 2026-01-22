# Toast Component Documentation

## Overview

The toast notification system for GrantSignal is built on top of [Sonner](https://sonner.emilkowal.ski/), providing a clean API with built-in support for undo actions.

## Installation Status

✅ **Already Configured**
- Sonner package installed: `sonner@^2.0.7`
- Toaster component added to [root layout](src/app/layout.tsx:26)
- Position: bottom-right
- Theme: dark

## Files

- [src/components/ui/toast.tsx](src/components/ui/toast.tsx) - Main toast component and API
- [src/components/ui/toast.examples.tsx](src/components/ui/toast.examples.tsx) - Usage examples
- [src/app/layout.tsx](src/app/layout.tsx) - Toaster container

## Basic Usage

```tsx
import { toast } from '@/components/ui/toast'

// Simple toasts
toast.success('Operation completed')
toast.error('Something went wrong')
toast.info('Here is some info')

// With custom duration
toast.success('Message', { duration: 10000 })
```

## Toast with Undo Action

```tsx
import { toast } from '@/components/ui/toast'

const handleCardMove = async (cardId: string, newStatus: string) => {
  const previousStatus = card.status

  // Update the card
  await updateCard(cardId, newStatus)

  // Show toast with undo
  toast.success(`Moved card to ${newStatus}`, {
    action: {
      label: 'Undo',
      onClick: async () => {
        await updateCard(cardId, previousStatus)
        toast.info('Move undone')
      }
    },
    duration: 5000
  })
}
```

## TypeScript Interface

```tsx
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number // milliseconds, default: 5000
}
```

## Current Implementation

The toast with undo functionality is currently implemented in:
- [src/components/pipeline/pipeline-kanban.tsx](src/components/pipeline/pipeline-kanban.tsx) - For grant card moves

When a grant card is moved between pipeline stages, users see:
```
✓ Moved "Grant Title" to Writing [Undo]
```

Clicking "Undo" reverts the grant to its previous status and shows:
```
ℹ Restored "Grant Title" to Researching
```

## Advanced Features

### Promise-based toasts (loading states)
```tsx
toast.promise(fetchData(), {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed'
})
```

### Manual loading toasts
```tsx
const id = toast.loading('Processing...')
// Later...
toast.dismiss(id)
toast.success('Done!')
```

## Best Practices

1. **Keep messages concise** - Users should understand at a glance
2. **Use appropriate types** - success for confirmations, error for failures, info for neutral updates
3. **Provide undo for destructive actions** - Give users a safety net
4. **Set reasonable durations** - 3-5 seconds for info, longer for actions that need user interaction
5. **Handle errors in undo actions** - Always provide feedback if undo fails
6. **Don't spam toasts** - Queue them or dismiss previous ones for the same action

## Configuration

The Toaster is configured in [src/app/layout.tsx](src/app/layout.tsx):

```tsx
<Toaster position="bottom-right" theme="dark" />
```

Available positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`

## Additional Resources

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [Usage Examples](src/components/ui/toast.examples.tsx)
