import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/auth'
import { aiController } from './aiController'

export const aiRouter = Router()

// Dedicated rate limiter for AI generation (approx. 20 requests / 15 min per IP)
const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many brief generations requested, please try again later.' },
})

aiRouter.use(requireAuth)

// Mounted at /api/briefs/generate (see backend/src/briefs/briefRouter.ts or app.ts)
aiRouter.post('/generate', generationLimiter, aiController.generateBrief)
