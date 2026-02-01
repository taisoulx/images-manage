import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()

  console.log('开始填充种子数据...')

  const testImages = [
    {
      filename: 'test1.jpg',
      path: '/images/test1.jpg',
      size: 1024000,
      hash: 'abc123',
      description: '测试图片1',
    },
    {
      filename: 'test2.jpg',
      path: '/images/test2.jpg',
      size: 2048000,
      hash: 'def456',
      description: '测试图片2',
    },
    {
      filename: '风景.jpg',
      path: '/images/风景.jpg',
      size: 3072000,
      hash: 'ghi789',
      description: '北京风景',
    },
  ]

  for (const imageData of testImages) {
    const image = await prisma.image.create({
      data: {
        ...imageData,
        metadata: {
          create: {
            exifMake: 'Canon',
            exifModel: 'EOS 5D Mark IV',
            exifIso: 100,
            exifAperture: 2.8,
            exifExposureTime: '1/200',
            gpsLatitude: 39.9042,
            gpsLongitude: 116.4074,
          },
        },
        tags: {
          create: [
            { tag: '风景' },
            { tag: '北京' },
            { tag: 'Canon' },
          ],
        },
      },
    })

    console.log(`创建图片: ${image.filename}`)
  }

  console.log('种子数据填充完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
