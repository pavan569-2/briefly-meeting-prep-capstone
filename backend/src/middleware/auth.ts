import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin'

/**
 * Express middleware that validates a Bearer JWT using the Supabase admin client.
 *
 * Rejects with 401 for:
 *   - missing Authorization header
 *   - malformed header (not "Bearer <token>")
 *   - empty token
 *   - invalid or expired token
 *
 * On success, attaches { id, email } to req.user and calls next().
 * Supabase error details are never forwarded to the client.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user || !user.email) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.user = { id: user.id, email: user.email }
  next()
}
