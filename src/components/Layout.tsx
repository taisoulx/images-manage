import { Outlet, Link, useLocation } from 'react-router-dom'

export function Layout() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') ? 'text-primary' : 'text-foreground'
                }`}
              >
                首页
              </Link>
              <Link
                to="/gallery"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/gallery') ? 'text-primary' : 'text-foreground'
                }`}
              >
                图库
              </Link>
              <Link
                to="/search"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/search') ? 'text-primary' : 'text-foreground'
                }`}
              >
                搜索
              </Link>
              <Link
                to="/upload"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/upload') ? 'text-primary' : 'text-foreground'
                }`}
              >
                上传
              </Link>
            </div>
          </div>
        </nav>
      </main>
      <Outlet />
    </div>
  )
}
