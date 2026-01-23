'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

/**
 * Offline Banner Component
 * Shows a banner at the top of the page when the user goes offline
 * Automatically hides when connection is restored
 *
 * Usage:
 * Add this component to your layout:
 * <OfflineBanner />
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Show "reconnected" message briefly when coming back online
    if (isOnline && !showReconnected) {
      const wasOffline = sessionStorage.getItem('was-offline')
      if (wasOffline) {
        setShowReconnected(true)
        sessionStorage.removeItem('was-offline')

        // Hide the reconnected message after 3 seconds
        const timer = setTimeout(() => {
          setShowReconnected(false)
        }, 3000)

        return () => clearTimeout(timer)
      }
    }

    // Track offline state
    if (!isOnline) {
      sessionStorage.setItem('was-offline', 'true')
    }
  }, [isOnline, showReconnected])

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top">
        <div className="flex items-center justify-center gap-3">
          <Wifi className="w-5 h-5" />
          <p className="text-sm font-medium">
            You're back online
          </p>
        </div>
      </div>
    )
  }

  // Show offline message
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <WifiOff className="w-5 h-5" />
          <p className="text-sm font-medium">
            You're offline. Some features may not work.
          </p>
        </div>
      </div>
    )
  }

  return null
}
