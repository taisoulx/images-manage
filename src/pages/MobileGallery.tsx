import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ImageViewer } from '@/components/mobile/ImageViewer'

interface Image {
  id: number
  filename: string
  path: string
  size: number
  description?: string
  created_at: string
}

export function MobileGallery() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverUrl] = useState(() => window.location.origin)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)
  const [editingFilename, setEditingFilename] = useState(false)
  const [newFilename, setNewFilename] = useState('')
  const [filenameError, setFilenameError] = useState('')
  const [savingFilename, setSavingFilename] = useState(false)

  // 计算当前图片索引
  const currentIndex = useMemo(() => {
    if (!selectedImage) return -1
    return images.findIndex(img => img.id === selectedImage.id)
  }, [selectedImage, images])

  // 上一张
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevImage = images[currentIndex - 1]
      setSelectedImage(prevImage)
      // 重置编辑状态
      setEditingFilename(false)
      setEditingDescription(false)
    }
  }

  // 下一张
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      const nextImage = images[currentIndex + 1]
      setSelectedImage(nextImage)
      // 重置编辑状态
      setEditingFilename(false)
      setEditingDescription(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async (query?: string, append = false) => {
    try {
      const searchParams = query ? `?search=${encodeURIComponent(query)}` : ''
      const response = await fetch(`${serverUrl}/api/images${searchParams}`)
      const data = await response.json()

      if (append) {
        setImages(prev => [...prev, ...data.images])
      } else {
        setImages(data.images)
      }
      setHasMore(data.images.length >= 20)
    } catch (error) {
      console.error('加载图片失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setLoading(true)
    // 搜索时总是替换列表
    loadImages(value, false)
  }

  const handleLoadMore = () => {
    // 加载更多时追加到列表
    loadImages(searchQuery, true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这张图片吗？')) return

    try {
      await fetch(`${serverUrl}/api/images/${id}`, {
        method: 'DELETE',
      })
      setImages(prev => prev.filter(img => img.id !== id))
      setSelectedImage(null)
    } catch (error) {
      alert('删除失败')
    }
  }

  const handleSaveDescription = async () => {
    if (!selectedImage) return

    setSavingDescription(true)
    try {
      const response = await fetch(`${serverUrl}/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setImages(prev =>
        prev.map(img =>
          img.id === selectedImage.id
            ? { ...img, description: newDescription || undefined }
            : img
        )
      )
      setSelectedImage({ ...selectedImage, description: newDescription || undefined })
      setEditingDescription(false)

      // 显示成功提示
      alert('描述已保存')
    } catch (error) {
      alert('保存失败，请重试')
    } finally {
      setSavingDescription(false)
    }
  }

  // 新增：保存文件名
  const handleSaveFilename = async () => {
    if (!selectedImage) return

    if (!newFilename.trim()) {
      setFilenameError('文件名不能为空')
      return
    }

    setSavingFilename(true)
    setFilenameError('')
    try {
      const response = await fetch(`${serverUrl}/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newFilename }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      const result = await response.json()
      const oldExtension = selectedImage.filename.substring(selectedImage.filename.lastIndexOf('.'))
      const newFilenameWithExt = newFilename.trim() + oldExtension

      setImages(prev =>
        prev.map(img =>
          img.id === selectedImage.id
            ? { ...img, filename: result.filename || newFilenameWithExt }
            : img
        )
      )
      setSelectedImage({ ...selectedImage, filename: result.filename || newFilenameWithExt })
      setEditingFilename(false)

      // 显示成功提示
      alert('文件名已保存')
    } catch (error: any) {
      setFilenameError(error.message || '保存失败，请重试')
    } finally {
      setSavingFilename(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-gold/5 pb-24">
      {/* 顶部搜索栏 */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="p-4 space-y-3">
          <h1 className="text-xl font-bold text-foreground">我的图库</h1>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索图片名称或描述..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 图片网格 */}
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground">还没有图片</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-6 py-2.5 bg-gold text-background rounded-xl font-medium hover:bg-gold/90 transition-colors"
            >
              上传第一张图片
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="aspect-square overflow-hidden rounded-lg bg-surface"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <img
                  src={`${serverUrl}/api/images/${image.id}/thumbnail`}
                  alt={image.filename}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {hasMore && !loading && images.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 mt-4 text-sm text-gold hover:text-gold/80 transition-colors"
          >
            加载更多
          </button>
        )}
      </div>

      {/* 图片详情弹窗 */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95" onClick={() => setSelectedImage(null)}>
          <div className="h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 顶部工具栏 */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* 图片查看器（支持手势缩放和滑动） */}
            <div className="flex-1">
              <ImageViewer
                src={`${serverUrl}/api/images/${selectedImage.id}/file`}
                alt={selectedImage.filename}
                currentIndex={currentIndex}
                totalImages={images.length}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onClose={() => setSelectedImage(null)}
              />
            </div>

            {/* 底部信息面板 - 点击编辑时显示 */}
            {(editingFilename || editingDescription) && (
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black via-black/90 to-transparent" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {/* 文件名 - 可编辑 */}
                  {editingFilename && (
                    <div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFilename}
                            onChange={(e) => {
                              setNewFilename(e.target.value)
                              setFilenameError('')
                            }}
                            placeholder="输入文件名"
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-gold"
                            disabled={savingFilename}
                            autoFocus
                          />
                          <span className="px-3 py-2 bg-white/10 text-white/60 rounded-xl text-sm flex items-center">
                            {selectedImage.filename.substring(selectedImage.filename.lastIndexOf('.'))}
                          </span>
                        </div>
                        {filenameError && (
                          <p className="text-red-400 text-xs">{filenameError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveFilename}
                            disabled={savingFilename}
                            className="flex-1 px-4 py-2 bg-gold text-background rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {savingFilename ? (
                              <>
                                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                保存中...
                              </>
                            ) : (
                              '保存'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingFilename(false)
                              setFilenameError('')
                            }}
                            disabled={savingFilename}
                            className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 描述 - 可编辑 */}
                  {editingDescription && (
                    <div>
                      <div className="space-y-2">
                        <textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="添加描述..."
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-gold"
                          rows={2}
                          disabled={savingDescription}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveDescription}
                            disabled={savingDescription}
                            className="flex-1 px-4 py-2 bg-gold text-background rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {savingDescription ? (
                              <>
                                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                保存中...
                              </>
                            ) : (
                              '保存'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingDescription(false)
                              setNewDescription(selectedImage.description || '')
                            }}
                            disabled={savingDescription}
                            className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 底部快速操作栏（非编辑状态） */}
            {!(editingFilename || editingDescription) && (
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  {/* 文件名和文件信息 */}
                  <div>
                    <p className="text-sm text-white font-medium">{selectedImage.filename}</p>
                    <p className="text-xs text-white/60">
                      {formatFileSize(selectedImage.size)} · {formatDate(selectedImage.created_at)}
                    </p>
                  </div>

                  {/* 快速编辑按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingFilename(true)
                        setNewFilename(selectedImage.filename.substring(0, selectedImage.filename.lastIndexOf('.')))
                        setFilenameError('')
                      }}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      编辑文件名
                    </button>
                    <button
                      onClick={() => {
                        setEditingDescription(true)
                        setNewDescription(selectedImage.description || '')
                      }}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {selectedImage.description ? '编辑描述' : '添加描述'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="flex items-center justify-around py-2">
          {[
            { path: '/', icon: '◐', label: '首页' },
            { path: '/gallery', icon: '▦', label: '图库' },
            { path: '/upload', icon: '↑', label: '上传' },
            { path: '/settings', icon: '⚙', label: '设置' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200
                ${location.pathname === item.path
                  ? 'bg-gold/20 text-gold'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
