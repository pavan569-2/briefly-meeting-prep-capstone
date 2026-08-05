import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ANTHROPIC_MODEL: z.string().min(1, 'ANTHROPIC_MODEL is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  PORT: z.coerce.number().int().positive().default(3000),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const lines = result.error.issues.map(
    (issue) => `  • ${issue.path.join('.')}: ${issue.message}`,
  )
  // Throw — never print secret values, only field names and messages.
  // index.ts catches this at startup; no process.exit() needed here.
  throw new Error(
    `[Briefly] Environment validation failed. Check your .env file:\n${lines.join('\n')}`,
  )
}

export const env = result.data
