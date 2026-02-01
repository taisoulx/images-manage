import { useAppStore } from '@/stores/appStore'
import { Link } from 'react-router-dom'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

export function Home() {
  const { setIsLoading } = useAppStore()

  const handleTest = async () => {
    setIsLoading(true)
    try {
      await invokeWithErrorHandling('ping')
      alert('后端连接成功!')
    } catch (error) {
      console.error('测试失败:', error)
      alert('后端连接失败')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    '跨平台支持（Windows/macOS）',
    '高性能图片处理和缩略图生成',
    '智能搜索（支持中文）',
    '局域网移动端访问',
    '安全的密码保护',
    '批量上传和进度显示',
  ]

  const quickActions = [
    { path: '/gallery', label: '图库', icon: '📷' },
    { path: '/upload', label: '上传', icon: '📤' },
    { path: '/search', label: '搜索', icon: '🔍' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">图片管理软件</h1>
        <p className="text-muted-foreground mb-6">
          跨平台图片管理系统，支持万张级图片的高效管理和智能搜索
        </p>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={useAppStore.getState().isLoading}
          >
            {useAppStore.getState().isLoading ? '测试中...' : '测试后端'}
          </button>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">功能特性</h2>
          <ul className="space-y-2 text-muted-foreground">
            {features.map((feature, index) => (
              <li key={index}>✓ {feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="bg-card rounded-lg border border-border p-6 hover:border-primary transition-colors cursor-pointer"
          >
            <div className="text-4xl mb-2">{action.icon}</div>
            <div className="font-semibold">{action.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
