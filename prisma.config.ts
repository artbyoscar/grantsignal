import path from 'node:path'
import type { PrismaConfig } from 'prisma'

export default {
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  migrate: {
    async url() {
      return process.env.DATABASE_URL ?? ''
    },
    async directUrl() {
      return process.env.DIRECT_URL ?? ''
    },
  },
} satisfies PrismaConfig
