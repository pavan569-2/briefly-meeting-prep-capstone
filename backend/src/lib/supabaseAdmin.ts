import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

/**
 * Supabase admin client using the service-role key.
 * Never expose this client or its credentials to the frontend.
 *
 * Session persistence and token auto-refresh are disabled because
 * this client runs in a stateless server environment.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
