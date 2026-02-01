import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import os from 'os'

const fastify = Fastify({ logger: true })

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
})

await fastify.register(fastifyStatic, {
  root: `${process.cwd()}/public`,
  prefix: '/',
})

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() }
})

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now() }
})

fastify.get('/api/network', async () => {
  const interfaces = os.networkInterfaces()
  let ipAddress = 'localhost'

  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address
        break
      }
    }
  }

  const port = 3000
  const url = `http://${ipAddress}:${port}`

  return {
    ipAddress,
    port,
    url,
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server running on port 3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
