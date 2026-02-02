import { memo, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { invoke } from '@tauri-apps/api/core'

interface ImageCardProps {
  image: any
  onEdit?: (image: any) => void
  onViewMode?: 'grid' | 'list'
}

function ImageCardComponent({ image, onEdit, onViewMode = 'grid' }: ImageCardProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (inView && !imageUrl && !error) {
      loadImage()
    }
  }, [inView])

  const loadImage = async () => {
    try {
      setLoading(true)
      const path = image.thumbnail_path || image.path
      if (path) {
        const dataUrl = await invoke<string>('get_image_data', { path })
        setImageUrl(dataUrl)
      }
    } catch (err) {
      console.error('加载图片失败:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // 列表视图模式
  if (onViewMode === 'list') {
    return (
      <div
        ref={ref}
        className="group relative flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-all duration-300 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onEdit?.(image)}
      >
        {/* 缩略图 */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
          {loading ? (
            <div className="w-full h-full skeleton" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={image.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground/30">
              📷
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{image.filename}</p>
          <p className="text-sm text-muted-foreground truncate">
            {image.description || '暂无描述'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(Number(image.size) / 1024).toFixed(1)} KB · {new Date(image.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>

        {/* 操作按钮 */}
        <div
          className={`flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(image)
            }}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-gold transition-colors"
            title="编辑"
          >
            ✏️
          </button>
        </div>
      </div>
    )
  }

  // 网格视图模式
  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-lg bg-card border border-border image-card-hover cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(image)}
    >
      {/* 图片容器 */}
      <div className="aspect-square relative bg-surface">
        {inView ? (
          loading ? (
            <div className="absolute inset-0 skeleton" />
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={image.filename}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* 悬停时显示的遮罩 */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* 文件信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium truncate text-foreground">
                    {image.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {image.description || '暂无描述'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(Number(image.size) / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* 编辑按钮 */}
                <button
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-gold hover:text-background"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(image)
                  }}
                  title="编辑"
                >
                  ✏️
                </button>
              </div>
            </>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <span className="text-3xl mb-2">❌</span>
              <span className="text-xs">加载失败</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl text-muted-foreground/30">📷</span>
            </div>
          )
        ) : (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* 选中标记（悬停时显示） */}
        <div
          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-gold bg-background/80 backdrop-blur-sm transition-all duration-300 ${
            isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          <div
            className={`w-full h-full rounded-full bg-gold transition-all duration-300 ${
              isHovered ? 'scale-50' : 'scale-0'
            }`}
          />
        </div>
      </div>

      {/* 底部信息栏（非悬停时显示） */}
      {!isHovered && imageUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
          <p className="text-xs text-foreground/80 truncate">
            {image.filename}
          </p>
        </div>
      )}
    </div>
  )
}

export const ImageCard = memo(ImageCardComponent)
