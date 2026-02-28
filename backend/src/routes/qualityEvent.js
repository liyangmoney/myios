import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import {
  getQualityEvents,
  getQualityEventDetail,
  createQualityEvent,
  updateQualityEvent,
  deleteQualityEvent,
  addComment,
  getStatistics
} from '../controllers/qualityEvent.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getQualityEvents)
router.get('/statistics', getStatistics)
router.get('/:id', getQualityEventDetail)
router.post('/', createQualityEvent)
router.put('/:id', updateQualityEvent)
router.delete('/:id', deleteQualityEvent)
router.post('/:id/comments', addComment)

export default router
