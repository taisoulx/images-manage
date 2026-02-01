import sharp from 'sharp'

export type ImageSize = 'large' | 'medium' | 'small' | 'thumb'

export interface ThumbnailConfig {
  size: ImageSize
  width: number
  height: number
  quality: number
  suffix: string
}

const THUMBNAIL_CONFIGS: ThumbnailConfig[] = [
  { size: 'large', width: 1920, height: 1080, quality: 85, suffix: 'large' },
  { size: 'medium', width: 800, height: 600, quality: 80, suffix: 'medium' },
  { size: 'small', width: 400, height: 300, quality: 75, suffix: 'small' },
  { size: 'thumb', width: 200, height: 200, quality: 70, suffix: 'thumb' },
]

export async function generateThumbnails(
  inputPath: string,
  outputDir: string,
): Promise<Map<ImageSize, string>> {
  const thumbnails = new Map<ImageSize, string>()

  for (const config of THUMBNAIL_CONFIGS) {
    const outputPath = `${outputDir}/${config.suffix}.webp`
    
    await sharp(inputPath)
      .resize(config.width, config.height, { fit: 'cover' })
      .webp({ quality: config.quality })
      .toFile(outputPath)

    thumbnails.set(config.size, outputPath)
  }

  return thumbnails
}

export async function validateImageFormat(file: File): Promise<boolean> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  return allowedTypes.includes(file.type)
}

export function getThumbnailPath(originalPath: string, size: ImageSize): string {
  const filename = originalPath.split('/').pop()
  const nameWithoutExt = filename?.split('.')[0]
  return `${nameWithoutExt}_${size}.webp`
}

export async function getImageMetadata(inputPath: string): Promise<sharp.Metadata> {
  const metadata = await sharp(inputPath).metadata()
  return metadata
}
