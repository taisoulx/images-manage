import { useAppStore } from '@/stores/appStore'

export function Gallery() {
  const { images, isLoading } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">图片图库</h1>
        <span className="text-muted-foreground">
          共 {images.length} 张图片
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg p-8">
          暂无图片，请先上传
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary transition-all cursor-pointer"
            >
              <div className="aspect-square bg-muted flex items-center justify-center">
                {image.thumbnailPath ? (
                  <img
                    src={image.thumbnailPath}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-muted-foreground/50">📷</span>
                )}
              </div>
              <div className="p-3 border-t border-border">
                <p className="text-sm font-medium truncate">{image.filename}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(Number(image.size) / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
