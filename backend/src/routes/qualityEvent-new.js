// 处理原生平台 base64 文件上传中间件
const handleBase64Upload = async (req, res, next) => {
  // 检查是否为 base64 上传（原生平台）
  if (req.body && req.body.isBase64 && req.body.data) {
    console.log('[handleBase64Upload] 安卓端 base64 上传')
    try {
      let { filename, type, size, data } = req.body
      
      // 处理中文编码
      if (typeof filename === 'string' && filename.includes('\\u')) {
        try { filename = JSON.parse('"' + filename + '"') } catch (e) {}
      }
      if (/[\ufffd\u00c0-\u00df]/.test(filename) || filename.includes('Ã')) {
        try { filename = Buffer.from(filename, 'latin1').toString('utf8') } catch (e) {}
      }
      
      // base64 解码
      const buffer = Buffer.from(data, 'base64')
      
      // 获取事件编号，直接保存到正确的目录（和PC端一致）
      const eventId = req.params.id
      const events = await query('SELECT event_no FROM quality_event WHERE id = ?', [eventId])
      const eventNo = events.length > 0 ? events[0].event_no : 'unknown'
      
      // 创建事件目录（如果不存在）
      const eventDir = path.join(uploadDir, eventNo)
      if (!fs.existsSync(eventDir)) {
        fs.mkdirSync(eventDir, { recursive: true })
      }
      
      // 生成文件名（和PC端multer一致）
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const originalName = filename || 'upload'
      const safeName = originalName.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
      const finalFilename = `${uniqueSuffix}_${safeName}`
      const finalPath = path.join(eventDir, finalFilename)
      
      // 直接写入文件（不经过temp目录，和PC端一致）
      fs.writeFileSync(finalPath, buffer)
      console.log('[handleBase64Upload] 已保存到:', finalPath)
      
      // 模拟 multer req.files 格式
      req.files = [{
        fieldname: 'files',
        originalname: originalName,
        encoding: '7bit',
        mimetype: type || 'application/octet-stream',
        destination: eventDir,
        filename: finalFilename,
        path: finalPath,
        size: buffer.length
      }]
      
      return next()
    } catch (error) {
      console.error('[handleBase64Upload] 失败:', error)
      return res.status(400).json({ code: 400, message: '文件处理失败: ' + error.message })
    }
  }
  
  // 不是 base64 上传，继续 multer 处理
  next()
}