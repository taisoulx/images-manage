import { useState, useRef, useEffect, useCallback } from 'react'

interface ImageViewerProps {
  src: string
  alt: string
  currentIndex: number
  totalImages: number
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
}

export function ImageViewer({
  src,
  alt,
  currentIndex,
  totalImages,
  onNext,
  onPrevious,
  onClose
}: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showHints, setShowHints] = useState(true)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 触摸状态
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const initialDistanceRef = useRef<number | null>(null)
  const initialScaleRef = useRef<number>(1)
  const lastTouchPositionRef = useRef<{ x: number; y: number } | null>(null)

  // 隐藏提示
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // 重置缩放状态
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指触摸 - 记录起始位置用于滑动检测
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      }
    } else if (e.touches.length === 2) {
      // 双指触摸 - 准备缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
      initialScaleRef.current = scale
      touchStartRef.current = null // 清除单指触摸记录
    }
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      // 双指缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      const newScale = Math.min(
        Math.max(
          (initialScaleRef.current * distance) / initialDistanceRef.current,
          0.5
        ),
        3
      )
      setScale(newScale)
    } else if (e.touches.length === 1 && scale > 1) {
      // 单指拖拽已缩放的图片
      if (!isDragging) {
        setIsDragging(true)
        lastTouchPositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
        return
      }

      if (lastTouchPositionRef.current) {
        const dx = e.touches[0].clientX - lastTouchPositionRef.current.x
        const dy = e.touches[0].clientY - lastTouchPositionRef.current.y

        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }))

        lastTouchPositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
      }
    }
  }

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) {
      // 缩放状态下，单指结束拖拽
      setIsDragging(false)
      lastTouchPositionRef.current = null
      initialDistanceRef.current = null
      return
    }

    // 检测滑动手势
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // 滑动阈值：水平移动超过 50px 且时间少于 300ms
      const isHorizontalSwipe = Math.abs(deltaX) > 50 && deltaTime < 300
      const isVerticalSwipe = Math.abs(deltaY) > 50 && deltaTime < 300

      if (isHorizontalSwipe && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX > 0) {
          // 右滑 - 上一张
          onPrevious()
        } else {
          // 左滑 - 下一张
          onNext()
        }
      } else if (isVerticalSwipe && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        // 上下滑动 - 关闭详情
        if (deltaY > 0) {
          onClose()
        }
      }
    }

    // 重置状态
    touchStartRef.current = null
    initialDistanceRef.current = null
    setIsDragging(false)
    lastTouchPositionRef.current = null
  }

  // 处理双击
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
      setPosition({ x: 0, y: 0 })
    } else {
      resetZoom()
    }
  }

  // 阻止图片默认的拖拽行为
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const transformStyle = {
    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  }

  const isZoomed = scale > 1

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 左侧箭头提示 */}
      {showHints && currentIndex > 0 && !isZoomed && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-6xl pointer-events-none animate-pulse">
          ‹
        </div>
      )}

      {/* 右侧箭头提示 */}
      {showHints && currentIndex < totalImages - 1 && !isZoomed && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-6xl pointer-events-none animate-pulse">
          ›
        </div>
      )}

      {/* 图片 */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onDragStart={handleDragStart}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={transformStyle}
          className={`max-w-full max-h-[70vh] object-contain rounded-lg cursor-${isZoomed ? 'grab' : 'pointer'} ${isDragging ? 'cursor-grabbing' : ''}`}
          draggable={false}
        />
      </div>

      {/* 图片计数器 */}
      {!isZoomed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {totalImages}
        </div>
      )}

      {/* 缩放提示 */}
      {isZoomed && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
          双击还原 • 拖拽移动
        </div>
      )}
    </div>
  )
}
