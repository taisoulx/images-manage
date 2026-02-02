import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface NavItem {
  path: string
  label: string
  icon: string
  shortcut?: string
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: '◐', shortcut: '⌘1' },
  { path: '/gallery', label: '图库', icon: '▦', shortcut: '⌘2' },
  { path: '/upload', label: '上传', icon: '↑', shortcut: '⌘3' },
  { path: '/qrcode', label: '局域网', icon: '◈', shortcut: '⌘4' },
  { path: '/settings', label: '设置', icon: '⚙', shortcut: '⌘,' },
]

export function Layout() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background flex">
      {/* 侧边导航栏 */}
      <aside
        className={`fixed left-0 top-0 h-full glass border-r border-border transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border">
          <Link
            to="/"
            className={`flex items-center gap-3 ${!isCollapsed && 'px-6'} w-full`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center flex-shrink-0">
              <span className="text-background font-display font-bold text-lg">P</span>
            </div>
            {!isCollapsed && (
              <span className="font-display font-semibold text-lg text-foreground animate-fade-in">
                Photon
              </span>
            )}
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="p-4 space-y-2">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
                ${isActive(item.path)
                  ? 'bg-gold/10 text-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
              style={{
                animationDelay: `${mounted ? index * 50 : 0}ms`,
                animation: mounted ? 'slideIn 0.3s ease-out forwards' : 'none',
                opacity: mounted ? 0 : 1,
              }}
            >
              <span className={`text-xl ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground/50">
                      {item.shortcut}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* 底部折叠按钮 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
            {!isCollapsed && <span className="font-medium">收起</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* 顶部状态栏 */}
        <header className="sticky top-0 z-40 glass border-b border-border">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="status-dot bg-gold"></div>
              <span className="text-sm text-muted-foreground">系统就绪</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
