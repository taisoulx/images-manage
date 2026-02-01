import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'

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
