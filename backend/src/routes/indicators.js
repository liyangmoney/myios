import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import {
  getProjectIndicators,
  getIndicatorDetail,
  submitIndicatorRecord
} from '../controllers/indicators.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/project/:projectId', getProjectIndicators)
router.get('/:id', getIndicatorDetail)
router.post('/:id/record', submitIndicatorRecord)

export default router
