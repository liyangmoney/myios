import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { operationLogMiddleware } from '../controllers/operationLog.js'
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
router.post('/', operationLogMiddleware('用户管理', 'CREATE', '创建新用户'), createUser)
router.put('/:id', operationLogMiddleware('用户管理', 'UPDATE', '修改用户信息'), updateUser)
router.delete('/:id', operationLogMiddleware('用户管理', 'DELETE', '删除用户'), deleteUser)
router.post('/:id/change-password', operationLogMiddleware('用户管理', 'UPDATE', '修改密码'), changePassword)

export default router