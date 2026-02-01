import { useAppStore } from '@/stores/appStore'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ImageCard } from '@/components/ImageCard'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

const ITEMS_PER_PAGE = 20

export function Gallery() {
  const { images, setImages, setIsLoading } = useAppStore()
  const [displayedImages, setDisplayedImages] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      try {
        const imageList = await invokeWithErrorHandling<any[]>('get_all_images')
        setImages(imageList)
        setDisplayedImages(imageList.slice(0, ITEMS_PER_PAGE))
        setHasMore(imageList.length > ITEMS_PER_PAGE)
      } catch (error) {
        console.error('加载图片失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [setImages, setIsLoading])

  useEffect(() => {
    if (inView && hasMore) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">图片图库</h1>
        <span className="text-sm text-muted-foreground">
          共 {images.length} 张图片，已显示 {displayedImages.length} 张
        </span>
      </div>

      {useAppStore.getState().isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg p-8">
          暂无图片，请先上传
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedImages.map((image: any, index: number) => (
            <ImageCard
              key={image.id || index}
              image={image}
            />
          ))}
          {hasMore && (
            <div ref={ref} className="col-span-full flex justify-center py-8">
              <div className="text-muted-foreground">加载更多...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
