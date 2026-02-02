import { useAppStore } from '@/stores/appStore'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ImageCard } from '@/components/ImageCard'
import { ImageDetailDialog } from '@/components/ImageDetailDialog'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

type ViewMode = 'grid' | 'list'

const ITEMS_PER_PAGE = 24

export function Gallery() {
  const { images, setImages, setIsLoading } = useAppStore()
  const [displayedImages, setDisplayedImages] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async (query?: string) => {
    setIsLoading(true)
    try {
      const command = query && query.trim() ? 'search_images' : 'get_all_images'
      const args = query && query.trim() ? { query } : {}
      const imageList = await invokeWithErrorHandling<any[]>(command, args)
      setImages(imageList)
      setDisplayedImages(imageList.slice(0, ITEMS_PER_PAGE))
      setHasMore(imageList.length > ITEMS_PER_PAGE)
    } catch (error) {
      console.error('加载图片失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (inView && hasMore && !useAppStore.getState().isLoading) {
      setPage((prevPage) => prevPage + 1)
    }
  }, [inView, hasMore])

  useEffect(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const newImages = images.slice(0, end)
    setDisplayedImages(newImages)
    setHasMore(end < images.length)
  }, [page, images])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadImages(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    loadImages()
  }

  const handleEditImage = (image: any) => {
    setSelectedImage(image)
    setIsDialogOpen(true)
  }

  const handleUpdate = () => {
    // 重新加载当前图片列表
    if (searchQuery.trim()) {
      loadImages(searchQuery)
    } else {
      loadImages()
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题栏和搜索 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in" style={{ animationDelay: '0ms', opacity: mounted ? 0 : 1 }}>
        <div>
          <h1 className="font-display text-3xl font-bold">图片图库</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 <span className="text-gold font-semibold">{images.length}</span> 张图片
            {displayedImages.length > 0 && (
              <span className="ml-2">，已显示 <span className="text-gold">{displayedImages.length}</span> 张</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 sm:flex-none flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索图片描述..."
              className="flex-1 sm:w-64 px-4 py-2 bg-card border border-border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all input-focus-effect"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-gold text-background rounded-lg hover:bg-gold/90 transition-colors"
            >
              🔍
            </button>
          </form>

          {/* 视图切换 */}
          <div className="flex bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-gold text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="网格视图"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-gold text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="列表视图"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {!useAppStore.getState().isLoading && images.length === 0 && (
        <div className="text-center py-20 animate-fade-in" style={{ animationDelay: '100ms', opacity: mounted ? 0 : 1 }}>
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card border border-border flex items-center justify-center">
            <span className="text-5xl">📷</span>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2">
            {searchQuery ? '未找到匹配的图片' : '暂无图片'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? '尝试使用其他关键词搜索' : '开始上传你的第一张图片吧'}
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark rounded-lg text-background font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
          >
            <span>↑</span>
            <span>上传图片</span>
          </a>
        </div>
      )}

      {/* 图片网格/列表 */}
      {images.length > 0 && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
          : 'space-y-3'
        }>
          {displayedImages.map((image: any, index: number) => (
            <div
              key={image.id || index}
              className="animate-scale-in"
              style={{
                animationDelay: `${Math.min(index * 30, 500)}ms`,
                opacity: mounted ? 0 : 1,
              }}
            >
              <ImageCard
                image={image}
                onEdit={handleEditImage}
                onViewMode={viewMode}
              />
            </div>
          ))}
          {/* 加载更多指示器 */}
          {hasMore && !useAppStore.getState().isLoading && (
            <div ref={ref} className="col-span-full flex justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                <span>加载更多...</span>
              </div>
            </div>
          )}
          {/* 加载状态 */}
          {useAppStore.getState().isLoading && displayedImages.length > 0 && (
            <div className="col-span-full flex justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">加载中...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 图片详情对话框 */}
      <ImageDetailDialog
        image={selectedImage}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedImage(null)
        }}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
