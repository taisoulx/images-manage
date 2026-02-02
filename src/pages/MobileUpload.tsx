import { useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function MobileUpload() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverUrl] = useState(() => window.location.origin)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const newUploads: UploadProgress[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploads(prev => [...newUploads, ...prev])
    uploadFiles(newUploads)
  }, [])

  const uploadFile = async (upload: UploadProgress): Promise<void> => {
    const formData = new FormData()
    formData.append('file', upload.file)

    try {
      const response = await fetch(`${serverUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('上传失败')

      setUploads(prev =>
        prev.map(u =>
          u.file === upload.file
            ? { ...u, progress: 100, status: 'success' }
            : u
        )
      )
    } catch (error) {
      setUploads(prev =>
        prev.map(u =>
          u.file === upload.file
            ? { ...u, status: 'error', error: error instanceof Error ? error.message : '上传失败' }
            : u
        )
      )
    }
  }

  const uploadFiles = async (newUploads: UploadProgress[]) => {
    await Promise.all(newUploads.map(uploadFile))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'success'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-gold/5 pb-20">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gold hover:text-gold/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-foreground">上传图片</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* 上传区域 */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragging
              ? 'border-gold bg-gold/10 scale-[1.02]'
              : 'border-border hover:border-gold/50 hover:bg-gold/5'
            }
          `}
        >
          <div className="p-8 text-center">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* 图标 */}
            <div className={`
              relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full
              transition-all duration-300 ${isDragging ? 'scale-110' : ''}
            `}>
              <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>

            {/* 文字 */}
            <p className="text-base font-medium text-foreground mb-1">
              {isDragging ? '释放以上传' : '点击或拖拽上传'}
            </p>
            <p className="text-sm text-muted-foreground">
              支持 JPG、PNG、WEBP、GIF 格式
            </p>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>

        {/* 上传列表 */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                上传列表 ({uploads.filter(u => u.status === 'success').length}/{uploads.length})
              </h2>
              {uploads.some(u => u.status === 'success') && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-gold hover:text-gold/80 transition-colors"
                >
                  清除已完成
                </button>
              )}
            </div>

            <div className="space-y-2">
              {uploads.map((upload, index) => (
                <div
                  key={`${upload.file.name}-${index}`}
                  className="p-3 rounded-xl bg-card border border-border overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    {/* 文件图标 */}
                    <div className={`
                      w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-all
                      ${upload.status === 'success' ? 'bg-green-500/20' : ''}
                      ${upload.status === 'error' ? 'bg-destructive/20' : ''}
                      ${upload.status === 'uploading' ? 'bg-gold/20' : ''}
                    `}>
                      {upload.status === 'uploading' && (
                        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      )}
                      {upload.status === 'success' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {upload.status === 'error' && (
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file.size)}
                      </p>
                      {upload.error && (
                        <p className="text-xs text-destructive mt-1">{upload.error}</p>
                      )}
                    </div>

                    {/* 进度 */}
                    {upload.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {uploads.length === 0 && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              📱 建议在 Wi-Fi 环境下上传大文件
            </p>
          </div>
        )}
      </div>

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
                  ? 'bg-gold/20 text-gold scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
