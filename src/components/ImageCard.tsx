import { memo } from 'react'
import { useInView } from 'react-intersection-observer'

interface ImageCardProps {
  image: any
}

function ImageCardComponent({ image }: ImageCardProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary transition-all cursor-pointer"
    >
      <div className="aspect-square bg-muted flex items-center justify-center">
        {inView ? (
          image.thumbnail_path ? (
            <img
              src={image.thumbnail_path}
              alt={image.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl text-muted-foreground/50">📷</span>
          )
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-sm font-medium truncate">{image.filename}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {(Number(image.size) / 1024).toFixed(2)} KB
        </p>
      </div>
    </div>
  )
}

export const ImageCard = memo(ImageCardComponent)
