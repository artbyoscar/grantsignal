import path from 'node:path'
import 'dotenv/config'

const config = {
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
}

export default config
