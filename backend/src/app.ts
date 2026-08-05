import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { requireAuth } from './middleware/auth'

const app = express()

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(express.json())

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)

// 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

// ── Routes ──────────────────────────────────────────────────────────────────

// Public
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected — requires a valid Supabase JWT in the Authorization header
app.get('/api/auth/me', requireAuth, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.json({ id: req.user.id, email: req.user.email })
})

// ── Error handlers ──────────────────────────────────────────────────────────

// 404 — must come after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Centralised error handler — 4-argument signature required by Express
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
