import type { Config } from 'drizzle-kit';

export default {
  schema: './src/core/lib/db/schema/definitions', // 直接指向 schema 目录
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db'
  }
} satisfies Config;