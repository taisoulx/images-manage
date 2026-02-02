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
  const [swipeOffset, setSwipeOffset] = useState(0)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 触摸状态
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const initialDistanceRef = useRef<number | null>(null)
  const initialScaleRef = useRef<number>(1)
  const lastTouchPositionRef = useRef<{ x: number; y: number } | null>(null)
  const swipeStartXRef = useRef(0)
  const isSwipingRef = useRef(false)

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
    if (scale > 1) return // 缩放时禁止滑动

    if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY

      touchStartRef.current = {
        x: touchX,
        y: touchY,
        time: Date.now()
      }
      swipeStartXRef.current = touchX
      setSwipeOffset(0)
      isSwipingRef.current = false
    } else if (e.touches.length === 2) {
      // 双指缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
      initialScaleRef.current = scale
      touchStartRef.current = null
      setSwipeOffset(0)
    }
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      // 双指缩放
      e.preventDefault()
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
    } else if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY

      if (scale > 1) {
        // 已缩放 - 单指拖拽图片
        e.preventDefault()
        if (!isDragging) {
          setIsDragging(true)
          lastTouchPositionRef.current = { x: touchX, y: touchY }
          return
        }

        if (lastTouchPositionRef.current) {
          const dx = touchX - lastTouchPositionRef.current.x
          const dy = touchY - lastTouchPositionRef.current.y

          setPosition(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
          }))

          lastTouchPositionRef.current = { x: touchX, y: touchY }
        }
      } else if (touchStartRef.current && !isSwipingRef.current) {
        // 未缩放 - 跟随手指滑动（实时反馈）
        const deltaX = touchX - swipeStartXRef.current
        // 限制滑动偏移量，增加阻尼效果
        const clampedOffset = Math.max(-150, Math.min(150, deltaX))
        setSwipeOffset(clampedOffset)
      }
    }
  }

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) {
      // 缩放状态下，结束拖拽
      setIsDragging(false)
      lastTouchPositionRef.current = null
      initialDistanceRef.current = null
      return
    }

    // 检测滑动手势
    if (touchStartRef.current && e.changedTouches.length === 1 && !isSwipingRef.current) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // 优化的滑动阈值
      const minSwipeDistance = 30
      const maxSwipeTime = 500
      const swipeVelocity = Math.abs(deltaX) / Math.max(deltaTime, 1)

      // 判断是否达到切换条件
      const shouldSwitch =
        Math.abs(swipeOffset) > 50 || // 滑动距离超过阈值
        (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime && swipeVelocity > 0.3) // 或快速滑动

      if (shouldSwitch) {
        isSwipingRef.current = true

        // 执行切换
        if (swipeOffset < 0 || deltaX < 0) {
          // 左滑（手指向左移动）- 看下一张
          // 当前图片向左移出，新图片从右边进入
          if (currentIndex < totalImages - 1) {
            performSwipe(() => onNext(), -1) // direction = -1（向左）
          } else {
            resetSwipe()
          }
        } else {
          // 右滑（手指向右移动）- 看上一张
          // 当前图片向右移出，新图片从左边进入
          if (currentIndex > 0) {
            performSwipe(() => onPrevious(), 1) // direction = 1（向右）
          } else {
            resetSwipe()
          }
        }
      } else if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX) * 2) {
        // 上下滑动 - 关闭详情
        if (deltaY > 50) {
          onClose()
        } else {
          resetSwipe()
        }
      } else {
        // 滑动距离不够，复位
        resetSwipe()
      }
    } else {
      resetSwipe()
    }

    // 重置状态
    touchStartRef.current = null
    initialDistanceRef.current = null
    setIsDragging(false)
    lastTouchPositionRef.current = null
  }

  // 执行滑动切换
  const performSwipe = (action: () => void, direction: number) => {
    // 1. 当前图片继续滑出屏幕
    const slideOutOffset = direction > 0 ? window.innerWidth : -window.innerWidth
    setSwipeOffset(slideOutOffset)

    // 2. 等待滑出动画完成后切换图片
    setTimeout(() => {
      action()

      // 3. 新图片从相反方向进入
      const slideInOffset = direction > 0 ? -window.innerWidth : window.innerWidth
      setSwipeOffset(slideInOffset)

      // 4. 短暂延迟后滑入到中心
      requestAnimationFrame(() => {
        setTimeout(() => {
          setSwipeOffset(0)
          isSwipingRef.current = false
        }, 50)
      })
    }, 200)
  }

  // 复位滑动
  const resetSwipe = () => {
    setSwipeOffset(0)
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
    transform: `translateX(${swipeOffset}px) scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
    transition: isDragging
      ? 'none'
      : Math.abs(swipeOffset) > 0
      ? 'none' // 滑动时无过渡
      : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // 复位时有过渡
  }

  const isZoomed = scale > 1

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 左侧箭头提示 */}
      {showHints && currentIndex > 0 && !isZoomed && !isSwipingRef.current && Math.abs(swipeOffset) < 10 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-6xl pointer-events-none animate-pulse">
          ‹
        </div>
      )}

      {/* 右侧箭头提示 */}
      {showHints && currentIndex < totalImages - 1 && !isZoomed && !isSwipingRef.current && Math.abs(swipeOffset) < 10 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-6xl pointer-events-none animate-pulse">
          ›
        </div>
      )}

      {/* 图片容器 */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full"
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
      {!isZoomed && Math.abs(swipeOffset) < 50 && (
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

      {/* 滑动进度指示器 */}
      {!isZoomed && Math.abs(swipeOffset) >= 10 && !isSwipingRef.current && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <div className={`w-2 h-2 rounded-full transition-all ${swipeOffset > 0 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`w-2 h-2 rounded-full transition-all ${swipeOffset < 0 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
      )}
    </div>
  )
}
