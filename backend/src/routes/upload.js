import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware } from '../utils/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

// 临时分片存储目录
const CHUNK_DIR = path.join(process.cwd(), 'uploads', 'chunks')
const FINAL_DIR = path.join(process.cwd(), 'uploads', 'quality-events')

// 确保目录存在
if (!fs.existsSync(CHUNK_DIR)) {
  fs.mkdirSync(CHUNK_DIR, { recursive: true })
}
if (!fs.existsSync(FINAL_DIR)) {
  fs.mkdirSync(FINAL_DIR, { recursive: true })
}

// 内存存储，分片直接处理
const upload = multer({ storage: multer.memoryStorage() })

// 活跃的上传任务（用于清理）
const activeUploads = new Map()

// 初始化分片上传
router.post('/init', authMiddleware, async (req, res) => {
  try {
    const { filename, size } = req.body
    
    if (!filename || !size) {
      return res.status(400).json({ code: 400, message: '缺少文件名或大小' })
    }
    
    const uploadId = uuidv4()
    const chunkDir = path.join(CHUNK_DIR, uploadId)
    
    fs.mkdirSync(chunkDir, { recursive: true })
    
    // 记录上传信息
    activeUploads.set(uploadId, {
      filename,
      size,
      createdAt: Date.now(),
      chunks: new Set()
    })
    
    res.json({
      code: 200,
      uploadId,
      message: '上传初始化成功'
    })
  } catch (error) {
    console.error('初始化上传失败:', error)
    res.status(500).json({ code: 500, message: '初始化上传失败' })
  }
})

// 上传分片
router.post('/chunk', authMiddleware, upload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, index, totalChunks } = req.body
    
    if (!uploadId || index === undefined || !totalChunks) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }
    
    const chunkDir = path.join(CHUNK_DIR, uploadId)
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({ code: 404, message: '上传任务不存在' })
    }
    
    // 保存分片
    const chunkPath = path.join(chunkDir, `chunk-${index}`)
    fs.writeFileSync(chunkPath, req.file.buffer)
    
    // 记录已上传的分片
    const uploadInfo = activeUploads.get(uploadId)
    if (uploadInfo) {
      uploadInfo.chunks.add(parseInt(index))
    }
    
    res.json({
      code: 200,
      message: `分片 ${index} 上传成功`,
      index: parseInt(index)
    })
  } catch (error) {
    console.error('上传分片失败:', error)
    res.status(500).json({ code: 500, message: '上传分片失败' })
  }
})

// 查询已上传的分片（用于断点续传）
router.get('/status/:uploadId', authMiddleware, (req, res) => {
  try {
    const { uploadId } = req.params
    const chunkDir = path.join(CHUNK_DIR, uploadId)
    
    if (!fs.existsSync(chunkDir)) {
      return res.json({ code: 200, uploadedChunks: [] })
    }
    
    // 读取已存在的分片
    const chunks = fs.readdirSync(chunkDir)
      .filter(f => f.startsWith('chunk-'))
      .map(f => parseInt(f.replace('chunk-', '')))
      .sort((a, b) => a - b)
    
    res.json({
      code: 200,
      uploadedChunks: chunks
    })
  } catch (error) {
    console.error('查询上传状态失败:', error)
    res.status(500).json({ code: 500, message: '查询失败' })
  }
})

// 合并分片
router.post('/merge', authMiddleware, async (req, res) => {
  try {
    const { uploadId, filename, eventNo } = req.body
    
    if (!uploadId || !filename || !eventNo) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }
    
    const chunkDir = path.join(CHUNK_DIR, uploadId)
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({ code: 404, message: '上传任务不存在' })
    }
    
    // 获取所有分片并按顺序排序
    const chunks = fs.readdirSync(chunkDir)
      .filter(f => f.startsWith('chunk-'))
      .map(f => ({
        index: parseInt(f.replace('chunk-', '')),
        path: path.join(chunkDir, f)
      }))
      .sort((a, b) => a.index - b.index)
    
    if (chunks.length === 0) {
      return res.status(400).json({ code: 400, message: '没有可合并的分片' })
    }
    
    // 创建最终文件
    const eventDir = path.join(FINAL_DIR, eventNo)
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true })
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(filename)
    const safeName = filename.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
    const finalFilename = `${uniqueSuffix}_${safeName}`
    const finalPath = path.join(eventDir, finalFilename)
    
    // 合并分片
    const writeStream = fs.createWriteStream(finalPath)
    for (const chunk of chunks) {
      const data = fs.readFileSync(chunk.path)
      writeStream.write(data)
    }
    writeStream.end()
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    
    // 清理临时分片
    fs.rmSync(chunkDir, { recursive: true, force: true })
    activeUploads.delete(uploadId)
    
    res.json({
      code: 200,
      message: '文件合并成功',
      url: `/uploads/quality-events/${eventNo}/${finalFilename}`,
      filename: finalFilename
    })
  } catch (error) {
    console.error('合并分片失败:', error)
    res.status(500).json({ code: 500, message: '合并分片失败: ' + error.message })
  }
})

// 取消上传（清理临时文件）
router.delete('/cancel/:uploadId', authMiddleware, (req, res) => {
  try {
    const { uploadId } = req.params
    const chunkDir = path.join(CHUNK_DIR, uploadId)
    
    if (fs.existsSync(chunkDir)) {
      fs.rmSync(chunkDir, { recursive: true, force: true })
    }
    
    activeUploads.delete(uploadId)
    
    res.json({ code: 200, message: '上传已取消' })
  } catch (error) {
    console.error('取消上传失败:', error)
    res.status(500).json({ code: 500, message: '取消上传失败' })
  }
})

// 定期清理过期的临时分片（24小时前）
setInterval(() => {
  const now = Date.now()
  const EXPIRE_TIME = 24 * 60 * 60 * 1000 // 24小时
  
  for (const [uploadId, info] of activeUploads) {
    if (now - info.createdAt > EXPIRE_TIME) {
      const chunkDir = path.join(CHUNK_DIR, uploadId)
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true })
      }
      activeUploads.delete(uploadId)
      console.log(`清理过期上传任务: ${uploadId}`)
    }
  }
}, 60 * 60 * 1000) // 每小时检查一次

export default router
