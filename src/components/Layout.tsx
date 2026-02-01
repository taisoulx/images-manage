import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export function Layout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/gallery', label: '图库' },
    { path: '/search', label: '搜索' },
    { path: '/upload', label: '上传' },
    { path: '/login', label: '登录' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-lg font-bold text-primary">
                图片管理
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary hover:bg-accent ${
                    isActive(link.path) ? 'text-primary bg-accent' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
