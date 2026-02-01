import { useAppStore } from '@/stores/appStore'
import { invoke } from '@tauri-apps/api/core'

export function Home() {
  const { setImages, setIsLoading } = useAppStore()

  const handleTest = async () => {
    setIsLoading(true)
    try {
      await invoke('ping')
      alert('后端连接成功!')
    } catch (error) {
      console.error('测试失败:', error)
      alert('后端连接失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h1 className="text-3xl font-bold mb-2">图片管理软件</h1>
        <p className="text-muted-foreground mb-6">
          跨平台图片管理系统，支持万张级图片的高效管理和智能搜索
        </p>

        <div className="flex space-x-4">
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={useAppStore.getState().isLoading}
          >
            {useAppStore.getState().isLoading ? '测试中...' : '测试后端'}
          </button>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">功能特性</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ 跨平台支持（Windows/macOS）</li>
            <li>✓ 高性能图片处理和缩略图生成</li>
            <li>✓ 智能搜索（支持中文）</li>
            <li>✓ 局域网移动端访问</li>
            <li>✓ 安全的密码保护</li>
            <li>✓ 批量上传和进度显示</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
