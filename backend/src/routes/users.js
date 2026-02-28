import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import {
  getUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getDepartments
} from '../controllers/users.js'

const router = express.Router()

// 所有路由都需要认证
router.use(authMiddleware)

// 用户管理路由
router.get('/', getUsers)
router.get('/departments', getDepartments)
router.get('/:id', getUserDetail)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)
router.post('/:id/change-password', changePassword)

export default router