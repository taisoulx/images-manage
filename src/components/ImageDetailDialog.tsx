import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface ImageDetailDialogProps {
  image: any
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function ImageDetailDialog({ image, isOpen, onClose, onUpdate }: ImageDetailDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [filename, setFilename] = useState('')  // 新增
  const [extension, setExtension] = useState('')  // 新增
  const [filenameError, setFilenameError] = useState('')  // 新增
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen && image) {
      setMounted(true)
      loadImage()
      setDescription(image.description || '')

      // 新增：分割文件名和扩展名
      const lastDotIndex = image.filename.lastIndexOf('.')
      if (lastDotIndex > 0) {
        setFilename(image.filename.substring(0, lastDotIndex))
        setExtension(image.filename.substring(lastDotIndex))
      } else {
        setFilename(image.filename)
        setExtension('')
      }
      setFilenameError('')  // 重置错误
    } else {
      setMounted(false)
      setImageUrl(null)
    }
  }, [isOpen, image])

  const loadImage = async () => {
    if (!image) return

    try {
      setLoading(true)
      const path = image.thumbnail_path || image.path
      if (path) {
        const dataUrl = await invoke<string>('get_image_data', { path })
        setImageUrl(dataUrl)
      }
    } catch (err) {
      console.error('加载图片失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!image) return

    // 验证文件名
    if (!filename.trim()) {
      setFilenameError('文件名不能为空')
      return
    }

    try {
      setSaving(true)
      await invoke('update_image_info', {
        id: image.id,
        filename: filename.trim(),  // 发送不含扩展名的文件名
        description: description || null
      })
      onUpdate?.()
      onClose()
    } catch (err: any) {
      console.error('保存失败:', err)
      // 显示后端返回的错误信息
      setFilenameError(err.toString() || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!image) return

    if (!confirm('确定要删除这张图片吗？此操作无法撤销。')) {
      return
    }

    try {
      await invoke('delete_image', { id: image.id })
      onUpdate?.()
      onClose()
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* 对话框 */}
      <div
        className={`relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-gold hover:text-background transition-all"
        >
          ✕
        </button>

        <div className="flex flex-col lg:flex-row max-h-[80vh]">
          {/* 图片预览 */}
          <div className="lg:w-2/3 bg-surface flex items-center justify-center p-8">
            {loading ? (
              <div className="w-full h-full skeleton rounded-lg" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={image?.filename}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <span className="text-6xl">📷</span>
                <p className="mt-4">图片加载失败</p>
              </div>
            )}
          </div>

          {/* 信息面板 */}
          <div className="lg:w-1/3 p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-border">
            <h2 className="font-display text-xl font-bold mb-6">图片信息</h2>

            <div className="flex-1 space-y-6 overflow-y-auto">
              {/* 文件名 - 可编辑 */}
              <div>
                <label className="text-sm text-muted-foreground">文件名</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => {
                      setFilename(e.target.value)
                      setFilenameError('')  // 清除错误
                    }}
                    placeholder="输入文件名"
                    className={`flex-1 px-3 py-2 bg-background border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all input-focus-effect ${
                      filenameError ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {extension && (
                    <span className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                      {extension}
                    </span>
                  )}
                </div>
                {filenameError && (
                  <p className="text-destructive text-xs mt-1">{filenameError}</p>
                )}
              </div>

              {/* 文件大小 */}
              <div>
                <label className="text-sm text-muted-foreground">文件大小</label>
                <p className="font-medium mt-1">
                  {image ? ((Number(image.size) / 1024).toFixed(1)) : '0'} KB
                </p>
              </div>

              {/* 上传时间 */}
              <div>
                <label className="text-sm text-muted-foreground">上传时间</label>
                <p className="font-medium mt-1">
                  {image ? new Date(image.created_at).toLocaleString('zh-CN') : '-'}
                </p>
              </div>

              {/* 文件路径 */}
              <div>
                <label className="text-sm text-muted-foreground">文件路径</label>
                <p className="font-medium mt-1 text-xs break-all" title={image?.path}>
                  {image?.path}
                </p>
              </div>

              {/* 描述 */}
              <div>
                <label className="text-sm text-muted-foreground">描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="添加图片描述..."
                  className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none input-focus-effect"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  描述可用于搜索图片
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-background font-semibold rounded-lg hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
