import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  getProjectAchievementRate
} from '../controllers/projects.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getProjects)
router.get('/:id', getProjectDetail)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)
router.get('/:id/achievement-rate', getProjectAchievementRate)

export default router
