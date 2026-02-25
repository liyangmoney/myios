import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { getUsers } from '../controllers/users.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getUsers)

export default router
