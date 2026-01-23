'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect online/offline status
 * Returns true when online, false when offline
 *
 * Usage:
 * const isOnline = useOnlineStatus()
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    // Handler for online event
    const handleOnline = () => {
      setIsOnline(true)
    }

    // Handler for offline event
    const handleOffline = () => {
      setIsOnline(false)
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
