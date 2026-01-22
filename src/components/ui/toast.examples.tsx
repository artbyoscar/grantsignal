/**
 * Toast Component Usage Examples
 *
 * This file demonstrates various use cases for the toast notification system.
 */

import { toast } from './toast'

// ============================================================================
// BASIC USAGE
// ============================================================================

export function basicToastExamples() {
  // Success toast
  toast.success('Operation completed successfully')

  // Error toast
  toast.error('Something went wrong')

  // Info toast
  toast.info('Here is some information')

  // With custom duration
  toast.success('This will dismiss in 10 seconds', { duration: 10000 })
}

// ============================================================================
// TOAST WITH UNDO ACTION
// ============================================================================

export function toastWithUndoExample() {
  // Example: Card move with undo
  const handleCardMove = async (cardId: string, newStatus: string, previousStatus: string) => {
    const cardTitle = 'My Grant Application'

    try {
      // Perform the move operation
      await moveCard(cardId, newStatus)

      // Show success toast with undo action
      toast.success(`Moved "${cardTitle}" to ${newStatus}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await moveCard(cardId, previousStatus)
              toast.info(`Restored "${cardTitle}" to ${previousStatus}`)
            } catch (error) {
              toast.error('Failed to undo move')
            }
          },
        },
        duration: 5000, // Give user 5 seconds to undo
      })
    } catch (error) {
      toast.error('Failed to move card')
    }
  }

  // Mock function for example
  async function moveCard(id: string, status: string) {
    console.log(`Moving ${id} to ${status}`)
  }
}

// ============================================================================
// TOAST WITH CUSTOM ACTIONS
// ============================================================================

export function toastWithCustomActionExample() {
  // Example: Delete with option to view details
  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId)

      toast.success('Item deleted successfully', {
        action: {
          label: 'View Details',
          onClick: () => {
            console.log('Navigating to deleted items...')
          },
        },
      })
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  // Mock function for example
  async function deleteItem(id: string) {
    console.log(`Deleting ${id}`)
  }
}

// ============================================================================
// PROMISE-BASED TOASTS (for loading states)
// ============================================================================

export function promiseToastExample() {
  const fetchData = async () => {
    // Simulated API call
    return new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // Show loading, then success/error automatically
  toast.promise(fetchData(), {
    loading: 'Fetching data...',
    success: 'Data loaded successfully',
    error: 'Failed to fetch data',
  })
}

// ============================================================================
// MANUAL LOADING TOAST
// ============================================================================

export function manualLoadingToastExample() {
  const performLongOperation = async () => {
    // Start loading toast
    const toastId = toast.loading('Processing...')

    try {
      // Perform operation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Dismiss loading and show success
      toast.dismiss(toastId)
      toast.success('Operation completed')
    } catch (error) {
      // Dismiss loading and show error
      toast.dismiss(toastId)
      toast.error('Operation failed')
    }
  }
}

// ============================================================================
// INTEGRATION EXAMPLE: Grant Pipeline Card Move
// ============================================================================

interface Grant {
  id: string
  title: string
  status: string
}

export function grantPipelineExample() {
  const handleGrantMove = async (
    grant: Grant,
    newStatus: string,
    previousStatus: string,
    updateStatusMutation: any
  ) => {
    const grantTitle = grant.title || 'Grant'

    try {
      // Update grant status
      await updateStatusMutation.mutateAsync({
        id: grant.id,
        status: newStatus
      })

      // Show success toast with undo
      toast.success(`Moved "${grantTitle}" to ${newStatus}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await updateStatusMutation.mutateAsync({
                id: grant.id,
                status: previousStatus
              })
              toast.info(`Restored "${grantTitle}" to ${previousStatus}`)
            } catch (error) {
              toast.error('Failed to undo move')
            }
          },
        },
        duration: 5000,
      })
    } catch (error) {
      toast.error('Failed to move grant')
    }
  }
}

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * Best Practices for Using Toasts:
 *
 * 1. Keep messages concise and clear
 * 2. Use appropriate toast types (success, error, info)
 * 3. Provide undo actions for destructive operations
 * 4. Set reasonable durations (3-5 seconds for info, longer for actions)
 * 5. Don't overwhelm users with too many toasts
 * 6. Use loading toasts for operations that take >1 second
 * 7. Always handle errors in undo actions
 * 8. Provide feedback when undo completes
 */
