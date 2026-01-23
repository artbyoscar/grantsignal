// Simple toast hook for notifications
// TODO: Replace with a proper toast implementation like sonner or react-hot-toast

import { useState, useCallback } from 'react'

interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = useCallback(({ title, description, variant }: Toast) => {
    // For now, just use window.alert
    // In production, this should be replaced with a proper toast library
    if (variant === 'destructive') {
      alert(`Error: ${title}\n${description || ''}`)
    } else {
      alert(`${title}\n${description || ''}`)
    }
  }, [])

  return { toast }
}
