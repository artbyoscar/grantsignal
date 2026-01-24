// src/trpc/react.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import superjson from 'superjson'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { TRPCClientError } from '@trpc/client'

import { type AppRouter } from '@/server/routers'

export const api = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { orgId } = useAuth()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth errors or client errors
              if (error instanceof TRPCClientError) {
                const httpStatus = error.data?.httpStatus
                if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404) {
                  return false
                }
              }
              return failureCount < 2
            },
          },
          mutations: {
            onError: (error) => {
              // Handle mutation errors with toast notifications
              if (error instanceof TRPCClientError) {
                const httpStatus = error.data?.httpStatus

                // Auth errors
                if (httpStatus === 401) {
                  toast.error('Authentication required', {
                    description: 'Please sign in to continue.',
                    action: {
                      label: 'Sign In',
                      onClick: () => {
                        window.location.href = '/sign-in'
                      },
                    },
                  })
                  return
                }

                // Permission errors
                if (httpStatus === 403) {
                  toast.error('Access denied', {
                    description: "You don't have permission to perform this action.",
                  })
                  return
                }

                // Not found errors
                if (httpStatus === 404) {
                  toast.error('Not found', {
                    description: 'The requested resource was not found.',
                  })
                  return
                }

                // Validation errors
                if (httpStatus === 400) {
                  toast.error('Invalid request', {
                    description: error.message || 'Please check your input and try again.',
                  })
                  return
                }

                // Server errors
                if (httpStatus && httpStatus >= 500) {
                  toast.error('Server error', {
                    description: 'Something went wrong. Please try again later.',
                  })
                  return
                }
              }

              // Network errors
              if (error.message.includes('fetch')) {
                toast.error('Connection error', {
                  description: 'Unable to connect. Check your internet connection.',
                })
                return
              }

              // Generic error
              toast.error('An error occurred', {
                description: error.message || 'Please try again.',
              })
            },
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              'x-organization-id': orgId || '',
            }
          },
          // CRITICAL: Include credentials so Clerk auth cookies are sent
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            })
          },
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
