const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

const clientInstance = globalForPrisma.prisma ?? require('@prisma/client').PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = clientInstance

export default clientInstance
