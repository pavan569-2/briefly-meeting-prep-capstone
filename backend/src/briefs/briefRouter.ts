import { Router } from 'express'
import { briefController } from './briefController'
import { requireAuth } from '../middleware/auth'

export const briefRouter = Router()

// All brief routes require authentication
briefRouter.use(requireAuth)

briefRouter.get('/', briefController.getBriefs)
briefRouter.get('/:id', briefController.getBriefById)
briefRouter.post('/', briefController.createBrief)
briefRouter.put('/:id', briefController.updateBrief)
briefRouter.delete('/:id', briefController.deleteBrief)
