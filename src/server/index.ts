import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import { randomBytes } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: true
})

// 注册 CORS
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
})

// 注册 multipart 支持（文件上传）
await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
})

// 数据库配置
const dbPath = join(__dirname, '../../../dev.db')
let db: Database.Database | null = null

function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

// 注册静态文件服务 - 使用项目根目录下的 dist
const staticRoot = join(__dirname, '../../dist')

await fastify.register(fastifyStatic, {
  root: staticRoot,
  prefix: '/',
  setHeaders: (res: any) => {
    // 禁用所有静态文件的缓存，确保获取最新版本
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
})

// SPA 路由回退
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.code(404).send({ error: 'Not Found' })
  }

  const indexPath = join(staticRoot, 'index.html')

  if (existsSync(indexPath)) {
    reply.type('text/html')
    return reply.send(readFileSync(indexPath))
  }

  return reply.code(404).send({ error: 'Page not found' })
})

// API 端点：获取网络信息
fastify.get('/api/network', async () => {
  const interfaces = os.networkInterfaces()
  let ipAddress = 'localhost'
  const allAddresses: string[] = []

  const priorityInterfaces = ['en0', 'en1', 'wlan0', 'Wi-Fi']

  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allAddresses.push(iface.address)
        if (ipAddress === 'localhost' || priorityInterfaces.some(p => name.includes(p))) {
          ipAddress = iface.address
        }
      }
    }
  }

  if (ipAddress === 'localhost' && allAddresses.length > 0) {
    ipAddress = allAddresses[0]
  }

  const port = 3000
  const url = `http://${ipAddress}:${port}`

  return { ipAddress, port, url, allAddresses, hostname: os.hostname() }
})

// API 端点：健康检查
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now(), version: '1.0.0' }
})

// API 端点：获取所有图片
fastify.get('/api/images', async (request: any) => {
  const database = getDb()
  const search = request.query.search as string | undefined

  let query = 'SELECT id, filename, path, size, description, created_at FROM images'
  const params: any[] = []

  if (search) {
    query += ' WHERE filename LIKE ? OR description LIKE ?'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY created_at DESC'

  const images = database.prepare(query).all(...params)
  return { images }
})

// API 端点：获取单张图片
fastify.get('/api/images/:id', async (request: any, reply: any) => {
  const database = getDb()
  const { id } = request.params

  const image = database.prepare('SELECT id, filename, path, size, description, created_at FROM images WHERE id = ?').get(id)

  if (!image) {
    return reply.code(404).send({ error: 'Image not found' })
  }

  return { image }
})

// API 端点：获取图片文件
fastify.get('/api/images/:id/file', async (request: any, reply: any) => {
  const database = getDb()
  const { id } = request.params

  const image = database.prepare('SELECT path, filename FROM images WHERE id = ?').get(id) as any

  if (!image) {
    return reply.code(404).send({ error: 'Image not found' })
  }

  const ext = image.filename.split('.').pop()?.toLowerCase()
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  }
  const contentType = contentTypes[ext || ''] || 'image/jpeg'

  const data = readFileSync(image.path)
  reply.type(contentType)
  return reply.send(data)
})

// API 端点：更新图片信息
fastify.put('/api/images/:id', async (request: any, _reply: any) => {
  const database = getDb()
  const { id } = request.params
  const { description, filename } = request.body

  // 获取当前图片信息
  const currentImage = database.prepare('SELECT id, filename, path FROM images WHERE id = ?').get(id) as any

  if (!currentImage) {
    return { success: false, error: 'Image not found' }
  }

  let finalFilename = currentImage.filename
  let finalPath = currentImage.path

  // 处理文件名更新
  if (filename && filename.trim()) {
    const { renameSync } = await import('fs')
    const { dirname, extname } = await import('path')

    const oldPath = currentImage.path
    const oldExtension = extname(oldPath)
    const newFilename = filename.trim() + oldExtension
    const newPath = join(dirname(oldPath), newFilename)

    // 检查文件名是否已存在
    const existing = database.prepare(
      'SELECT id FROM images WHERE filename = ?1 AND id != ?2'
    ).get(newFilename, id) as any

    if (existing) {
      return { success: false, error: `文件名 '${newFilename}' 已存在` }
    }

    // 重命名文件
    try {
      renameSync(oldPath, newPath)
      finalFilename = newFilename
      finalPath = newPath
    } catch (e: any) {
      return { success: false, error: `重命名文件失败: ${e.message}` }
    }
  }

  // 更新数据库
  database.prepare(
    'UPDATE images SET filename = ?, path = ?, description = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(finalFilename, finalPath, description || null, id)

  return { success: true, filename: finalFilename }
})

// API 端点：删除图片
fastify.delete('/api/images/:id', async (request: any, _reply: any) => {
  const database = getDb()
  const { id } = request.params

  const image = database.prepare('SELECT path FROM images WHERE id = ?').get(id) as any
  if (image) {
    // 删除文件
    try {
      const fs = await import('fs/promises')
      await fs.unlink(image.path).catch(() => {})
    } catch (e) {}

    // 删除数据库记录
    database.prepare('DELETE FROM images WHERE id = ?').run(id)
  }

  return { success: true }
})

// API 端点：上传图片
fastify.post('/api/upload', async (request: any, reply: any) => {
  const data = await request.file()

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' })
  }

  const buffer = await data.toBuffer()
  const filename = data.filename
  const ext = filename.split('.').pop() || 'jpg'

  // 生成哈希作为文件名
  const hash = randomBytes(16).toString('hex')
  const storageDir = join(__dirname, '../../../images', hash.slice(0, 2))
  const storagePath = join(storageDir, `${hash}.${ext}`)

  // 确保目录存在
  await import('fs/promises').then(fs => fs.mkdir(storageDir, { recursive: true }))

  // 保存文件
  writeFileSync(storagePath, buffer)

  // 保存到数据库
  const database = getDb()
  const result = database.prepare(
    'INSERT INTO images (filename, path, size, hash, created_at, updated_at) VALUES (?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
  ).run(filename, storagePath, buffer.length, hash)

  const imageId = result.lastInsertRowid

  return {
    success: true,
    image: {
      id: imageId,
      filename,
      path: storagePath,
      size: buffer.length,
      created_at: new Date().toISOString()
    }
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('✅ API 服务器已启动')
    console.log(`📡 本地访问: http://localhost:3000`)
    console.log(`🌐 局域网访问: http://192.168.3.28:3000`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
