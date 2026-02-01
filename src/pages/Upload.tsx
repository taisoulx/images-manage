import { useState } from 'react'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

interface FileData {
  name: string
  path: string
  size: number
}

export function Upload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSelectFiles = async () => {
    console.log('文件选择功能暂未实现，请使用拖拽上传')
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    try {
      const total = files.length
      let uploaded = 0

      for (const file of files) {
        await invokeWithErrorHandling('upload_image', { path: (file as any).path })
        uploaded++
        setProgress((uploaded / total) * 100)
      }

      alert('上传成功!')
      setFiles([])
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败')
    } finally {
      setUploading(false)
      setProgress(0)
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">上传图片</h1>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <p className="text-muted-foreground mb-4">
          拖拽图片到此处或点击选择文件
        </p>
        <button
          onClick={handleSelectFiles}
          disabled={uploading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          选择文件
        </button>
      </div>

      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              已选择 {files.length} 张图片
            </h2>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : '开始上传'}
            </button>
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                上传进度: {progress.toFixed(1)}%
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-card"
              >
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  📷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
