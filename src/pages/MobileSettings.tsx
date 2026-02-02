import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function MobileSettings() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverUrl, setServerUrl] = useState(() => window.location.origin)

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
          <h1 className="text-lg font-semibold text-foreground">设置</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 服务器地址 */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">服务器设置</h2>

          <div className="space-y-2">
            <label className="text-sm text-foreground">服务器地址</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="http://192.168.x.x:3000"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>确保手机和电脑在同一局域网</li>
              <li>在电脑上运行应用并查看二维码</li>
              <li>扫描二维码即可自动配置</li>
            </ul>
          </div>
        </div>

        {/* 关于 */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">关于</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">应用名称</span>
              <span className="text-foreground">图片管理软件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <span className="text-foreground">0.1.0</span>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">功能说明</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span>📷</span>
              <span>浏览电脑上的图片</span>
            </div>
            <div className="flex gap-2">
              <span>📤</span>
              <span>从手机上传图片到电脑</span>
            </div>
            <div className="flex gap-2">
              <span>🔍</span>
              <span>搜索图片描述和文件名</span>
            </div>
            <div className="flex gap-2">
              <span>✏️</span>
              <span>编辑图片描述信息</span>
            </div>
          </div>
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
    </div>
  )
}
