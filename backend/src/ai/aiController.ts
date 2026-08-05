import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { createMeetingBriefSchema } from '../briefs/briefSchemas'
import { briefService, NotFoundError } from '../briefs/briefService'
import { buildSystemPrompt, buildUserPrompt } from './promptBuilder'
import { generateBriefStream } from './briefGenerator'
import { setupSSE, sendComplete, sendError } from './streamParser'
import { validateGeneratedBrief } from './responseValidator'
import type { MeetingBrief } from '../types/brief'

// The generation payload matches create schema but excludes generatedBrief
const generateRequestSchema = createMeetingBriefSchema.omit({ generatedBrief: true }).strict()

export const aiController = {
  async generateBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    let payload
    let userId: string

    // 1. Pre-flight Validation (Normal JSON responses)
    try {
      userId = req.user!.id
      payload = generateRequestSchema.parse(req.body)
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors })
        return
      }
      next(error)
      return
    }

    let parentBrief: MeetingBrief | null = null
    if (payload.parentBriefId) {
      try {
        parentBrief = await briefService.getBriefById(payload.parentBriefId, userId)
      } catch (error) {
        if (error instanceof NotFoundError) {
          res.status(404).json({ error: 'Parent brief not found or not owned by user' })
          return
        }
        next(error)
        return
      }
    }

    // 2. Setup SSE
    setupSSE(res)
    // 3. Setup Abort Controller to handle client disconnects
    const abortController = new AbortController()
    const onClientDisconnect = () => {
      abortController.abort()
    }
    req.on('close', onClientDisconnect)

    try {
      // 4. Generate Prompts
      const systemPrompt = buildSystemPrompt()
      const userPrompt = buildUserPrompt(payload, parentBrief)

      // 5. Execute AI Generation
      const fullJsonText = await generateBriefStream(systemPrompt, userPrompt, res, abortController.signal)

      // 6. Validate Output
      const generatedBrief = validateGeneratedBrief(fullJsonText)

      // 7. Persist (only after successful generation and validation)
      const savedBrief = await briefService.createBrief(userId, {
        ...payload,
        generatedBrief,
      })

      // 8. Success Sequence
      sendComplete(res, savedBrief.id)
      res.end()
    } catch (error: unknown) {
      // Handle client disconnect aborts silently
      if (error instanceof Error && error.name === 'AbortError') {
        res.end()
        return
      }

      // Handle normal errors by sending SSE error
      console.error('[AI Generation Error]', error)
      sendError(res, 'Brief generation failed.')
      res.end()
    } finally {
      // Clean up listeners
      req.off('close', onClientDisconnect)
    }
  },
}
