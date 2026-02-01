import { useState, useRef } from 'react'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    const fileObjects: FileData[] = selectedFiles.map(file => ({
      name: file.name,
      path: (file as any).path || file.name,
      size: file.size
    }))

    setFiles([...files, ...fileObjects])
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
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    const droppedFiles = Array.from(e.dataTransfer.files) as any[]
    const fileObjects: FileData[] = droppedFiles.map(file => ({
      name: file.name,
      path: file.path || file.name,
      size: file.size
    }))

    setFiles([...files, ...fileObjects])
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
      <h1 className="text-2xl sm:text-3xl font-bold">上传图片</h1>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleSelectFiles}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <p className="text-muted-foreground mb-4">
          拖拽图片到此处或点击选择文件
        </p>
        <p className="text-sm text-muted-foreground">
          支持 JPG、PNG、WebP 格式
        </p>
      </div>

      {files.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                已选择 {files.length} 张图片
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                总大小: {(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex gap-2">
              {files.length > 0 && (
                <button
                  onClick={handleClearFiles}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-muted text-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  清空
                </button>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : '开始上传'}
              </button>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mb-4 p-3 rounded-lg ${
              uploadStatus.includes('失败') 
                ? 'bg-destructive/10 text-destructive-foreground' 
                : 'bg-muted text-foreground'
            }`}>
              {uploadStatus}
            </div>
          )}

          {uploading && (
            <div className="mb-4">
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                上传进度: {uploadProgress.toFixed(1)}%
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 border border-border rounded-lg bg-card hover:border-primary transition-colors"
              >
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  📷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.path}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
