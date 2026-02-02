import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Stats {
  totalImages: number
  totalSize: number
  recentCount: number
}

export function MobileHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ totalImages: 0, totalSize: 0, recentCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const serverUrl = window.location.origin
      const response = await fetch(`${serverUrl}/api/images`)
      const data = await response.json()

      const totalImages = data.images.length
      const totalSize = data.images.reduce((sum: number, img: any) => sum + (img.size || 0), 0)

      // 计算最近7天的图片数量
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentCount = data.images.filter((img: any) =>
        new Date(img.created_at) > weekAgo
      ).length

      setStats({ totalImages, totalSize, recentCount })
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const QuickAction = ({ icon, title, description, route, color }: {
    icon: string
    title: string
    description: string
    route: string
    color: string
  }) => (
    <button
      onClick={() => navigate(route)}
      className="p-4 rounded-xl bg-card border border-border text-left hover:border-gold/50 transition-all active:scale-[0.98]"
    >
      <div className={`w-12 h-12 rounded-xl bg-${color}-20 flex items-center justify-center mb-3`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-gold/5 pb-24">
      {/* 顶部欢迎区 */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground">
            图片管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            高效管理您的图片库
          </p>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* 统计卡片 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <div className="text-3xl mb-1">📷</div>
              <div className="text-2xl font-bold text-foreground">{stats.totalImages}</div>
              <div className="text-xs text-muted-foreground">总图片数</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
              <div className="text-3xl mb-1">💾</div>
              <div className="text-2xl font-bold text-foreground">{formatFileSize(stats.totalSize)}</div>
              <div className="text-xs text-muted-foreground">总大小</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl mb-1">🆕</div>
                  <div className="text-2xl font-bold text-foreground">{stats.recentCount}</div>
                  <div className="text-xs text-muted-foreground">最近7天新增</div>
                </div>
                <button
                  onClick={() => navigate('/gallery')}
                  className="px-4 py-2 bg-gold text-background rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
                >
                  查看全部
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 快捷操作 */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon="▦"
              title="浏览图库"
              description="查看所有图片"
              route="/gallery"
              color="amber"
            />
            <QuickAction
              icon="↑"
              title="上传图片"
              description="添加新图片"
              route="/upload"
              color="emerald"
            />
            <QuickAction
              icon="🔍"
              title="搜索图片"
              description="按名称或描述"
              route="/gallery"
              color="blue"
            />
            <QuickAction
              icon="⚙"
              title="设置"
              description="应用配置"
              route="/settings"
              color="gray"
            />
          </div>
        </div>

        {/* 使用提示 */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">💡 使用提示</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 点击图片可查看大图和编辑描述</li>
            <li>• 支持批量上传多张图片</li>
            <li>• 描述信息可用于快速搜索</li>
            <li>• 数据保存在本地，安全可靠</li>
          </ul>
        </div>
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
                ${item.path === '/'
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
