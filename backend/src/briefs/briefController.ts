import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  createMeetingBriefSchema,
  updateMeetingBriefSchema,
  uuidParamSchema,
} from './briefSchemas'
import { briefService, NotFoundError, ValidationError } from './briefService'

export const briefController = {
  async getBriefs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const briefs = await briefService.getBriefs(userId)
      res.json(briefs)
    } catch (error) {
      next(error)
    }
  },

  async getBriefById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = uuidParamSchema.parse(req.params)
      
      const brief = await briefService.getBriefById(id, userId)
      res.json(brief)
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid UUID format' })
        return
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      next(error)
    }
  },

  async createBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const payload = createMeetingBriefSchema.parse(req.body)
      
      const brief = await briefService.createBrief(userId, payload)
      res.status(201).json(brief)
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors })
        return
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
        return
      }
      next(error)
    }
  },

  async updateBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = uuidParamSchema.parse(req.params)
      const updates = updateMeetingBriefSchema.parse(req.body)

      const brief = await briefService.updateBrief(id, userId, updates)
      res.json(brief)
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors })
        return
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
        return
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      next(error)
    }
  },

  async deleteBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = uuidParamSchema.parse(req.params)

      await briefService.deleteBrief(id, userId)
      res.status(204).send()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid UUID format' })
        return
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      next(error)
    }
  },
}
