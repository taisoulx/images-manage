import { useState, useEffect } from 'react'
import { invokeWithErrorHandling } from '@/utils/errorHandler'
import { open } from '@tauri-apps/plugin-dialog'

interface FileData {
  name: string
  path: string
  size: number
}

export function Upload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: '图片',
            extensions: ['jpg', 'jpeg', 'png', 'webp']
          }
        ]
      })

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected]

        const fileObjects: FileData[] = paths.map(path => {
          const pathSegments = path.split(/[/\\]/)
          const name = pathSegments[pathSegments.length - 1] || path

          return {
            name,
            path,
            size: 0
          }
        })

        setFiles([...files, ...fileObjects])
      }
    } catch (error) {
      console.error('选择文件失败:', error)
      setUploadStatus('选择文件失败，请重试')
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('请先选择要上传的图片')
      setTimeout(() => setUploadStatus(''), 3000)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadStatus('开始上传...')

    try {
      const total = files.length
      let uploaded = 0
      let successCount = 0
      let failCount = 0

      for (const file of files) {
        try {
          await invokeWithErrorHandling('upload_image', { path: file.path })
          successCount++
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error)
          failCount++
        }

        uploaded++
        const progress = (uploaded / total) * 100
        setUploadProgress(progress)
        setUploadStatus(`正在上传: ${uploaded}/${total} (成功: ${successCount}, 失败: ${failCount})`)
      }

      setUploadStatus(`上传完成! 成功: ${successCount}, 失败: ${failCount}`)
      setTimeout(() => {
        if (successCount > 0) {
          setFiles([])
          setUploadProgress(0)
        }
        setUploadStatus('')
      }, 3000)
    } catch (error) {
      console.error('上传过程出错:', error)
      setUploadStatus('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setUploadStatus('请使用"选择文件"按钮来选择图片')
    setTimeout(() => setUploadStatus(''), 3000)
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleClearFiles = () => {
    setFiles([])
    setUploadProgress(0)
    setUploadStatus('')
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="animate-fade-in" style={{ animationDelay: '0ms', opacity: mounted ? 0 : 1 }}>
        <h1 className="font-display text-3xl font-bold">上传图片</h1>
        <p className="text-sm text-muted-foreground mt-1">
          支持 JPG、PNG、WebP 格式
        </p>
      </div>

      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleSelectFiles}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-300 group animate-fade-in
          ${isDragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-accent/50'}
        `}
        style={{ animationDelay: '100ms', opacity: mounted ? 0 : 1 }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-transparent to-gold/0 group-hover:from-gold/5 group-hover:to-gold/5 transition-all duration-500" />

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-card border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-gold/50 transition-all duration-300">
            <span className="text-4xl">↑</span>
          </div>
          <p className="text-lg font-medium mb-2 group-hover:text-gold transition-colors">
            点击选择图片文件
          </p>
          <p className="text-sm text-muted-foreground">
            支持批量上传
          </p>
        </div>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms', opacity: mounted ? 0 : 1 }}>
          {/* 操作栏 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border">
            <div>
              <h2 className="font-semibold">
                已选择 <span className="text-gold">{files.length}</span> 张图片
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                总大小: {(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClearFiles}
                disabled={uploading}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                清空
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-gold to-gold-dark text-background font-semibold rounded-lg hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {uploading ? '上传中...' : '开始上传'}
              </button>
            </div>
          </div>

          {/* 状态消息 */}
          {uploadStatus && (
            <div className={`p-4 rounded-lg animate-fade-in ${
              uploadStatus.includes('失败')
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : uploadStatus.includes('完成')
                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                : 'bg-muted'
            }`}>
              {uploadStatus}
            </div>
          )}

          {/* 进度条 */}
          {uploading && (
            <div className="p-4 rounded-lg bg-card border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">上传进度</span>
                <span className="text-sm font-medium text-gold">{uploadProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 文件列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="group relative flex items-start gap-3 p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms`, opacity: mounted ? 0 : 1 }}
              >
                <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  📷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.path}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                  title="移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
