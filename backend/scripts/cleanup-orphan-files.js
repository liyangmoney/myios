#!/usr/bin/env node
/**
 * 清理孤儿文件脚本
 * 每天运行一次，删除1天以上未被引用的上传文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传目录
const uploadDir = path.join(__dirname, '../uploads/quality-events')

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myios',
  port: process.env.DB_PORT || 3306
}

// 1天前的毫秒数
const ONE_DAY_MS = 24 * 60 * 60 * 1000

async function cleanOrphanFiles() {
  console.log(`[${new Date().toISOString()}] 开始清理孤儿文件...`)
  
  let connection
  let deletedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig)
    console.log('数据库连接成功')
    
    // 获取所有事件中的文件引用
    const [events] = await connection.execute(`
      SELECT 
        plan_files,
        implementation_files,
        check_files,
        act_files
      FROM quality_event
      WHERE deleted_at IS NULL
    `)
    
    // 收集所有被引用的文件名
    const referencedFiles = new Set()
    
    events.forEach(event => {
      // 解析各阶段文件
      const fileFields = [
        event.plan_files,
        event.implementation_files,
        event.check_files,
        event.act_files
      ]
      
      fileFields.forEach(field => {
        if (field) {
          try {
            const files = JSON.parse(field)
            files.forEach(file => {
              if (file.url) {
                // 提取文件名（如：1741234567-1234567890_测试文件.jpg）
                const filename = path.basename(file.url)
                referencedFiles.add(filename)
              }
            })
          } catch (e) {
            // 解析失败，跳过
          }
        }
      })
    })
    
    console.log(`数据库中引用的文件数量: ${referencedFiles.size}`)
    
    // 扫描上传目录
    if (!fs.existsSync(uploadDir)) {
      console.log('上传目录不存在，跳过清理')
      return
    }
    
    const eventDirs = fs.readdirSync(uploadDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
    
    console.log(`扫描到 ${eventDirs.length} 个事件目录`)
    
    for (const eventDir of eventDirs) {
      const eventPath = path.join(uploadDir, eventDir.name)
      const files = fs.readdirSync(eventPath)
      
      for (const filename of files) {
        const filePath = path.join(eventPath, filename)
        
        // 获取文件状态
        const stats = fs.statSync(filePath)
        const fileAge = Date.now() - stats.mtime.getTime()
        
        // 只处理1天以上的文件（避免误删正在上传的文件）
        if (fileAge < ONE_DAY_MS) {
          skippedCount++
          continue
        }
        
        // 检查是否被引用
        if (referencedFiles.has(filename)) {
          skippedCount++
          continue
        }
        
        // 删除孤儿文件
        try {
          fs.unlinkSync(filePath)
          console.log(`✅ 删除孤儿文件: ${eventDir.name}/${filename}`)
          deletedCount++
        } catch (err) {
          console.error(`❌ 删除失败: ${eventDir.name}/${filename}`, err.message)
          errorCount++
        }
      }
      
      // 如果目录为空，删除目录
      const remainingFiles = fs.readdirSync(eventPath)
      if (remainingFiles.length === 0) {
        try {
          fs.rmdirSync(eventPath)
          console.log(`📁 删除空目录: ${eventDir.name}`)
        } catch (err) {
          // 忽略删除目录错误
        }
      }
    }
    
    // 记录清理日志到数据库
    await connection.execute(`
      INSERT INTO cleanup_log (type, message, details, created_at)
      VALUES (?, ?, ?, NOW())
    `, [
      'orphan_files',
      `清理完成: 删除${deletedCount}个, 跳过${skippedCount}个, 错误${errorCount}个`,
      JSON.stringify({ deletedCount, skippedCount, errorCount, timestamp: new Date().toISOString() })
    ])
    
    console.log(`[${new Date().toISOString()}] 清理完成:`)
    console.log(`  - 删除: ${deletedCount} 个文件`)
    console.log(`  - 跳过: ${skippedCount} 个文件（1天内或被引用）`)
    console.log(`  - 错误: ${errorCount} 个`)
    
  } catch (error) {
    console.error('清理脚本执行失败:', error)
    
    // 记录错误日志
    if (connection) {
      try {
        await connection.execute(`
          INSERT INTO cleanup_log (type, message, details, created_at)
          VALUES (?, ?, ?, NOW())
        `, [
          'orphan_files_error',
          `清理失败: ${error.message}`,
          JSON.stringify({ error: error.stack, timestamp: new Date().toISOString() })
        ])
      } catch (e) {
        // 忽略日志记录错误
      }
    }
    
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 创建清理日志表（如果不存在）
async function initCleanupLogTable() {
  let connection
  try {
    connection = await mysql.createConnection(dbConfig)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cleanup_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('清理日志表初始化完成')
  } catch (error) {
    console.error('初始化日志表失败:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 主函数
async function main() {
  await initCleanupLogTable()
  await cleanOrphanFiles()
}

main()
