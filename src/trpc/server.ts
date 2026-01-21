// src/trpc/server.ts
import 'server-only'

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { headers } from 'next/headers'
import superjson from 'superjson'

import { type AppRouter } from '@/server/routers'

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const headersList = await headers()
        return {
          cookie: headersList.get('cookie') ?? '',
          'x-trpc-source': 'server',
        }
      },
    }),
  ],
})
