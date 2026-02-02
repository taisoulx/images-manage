import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface QuickAction {
  path: string
  label: string
  description: string
  icon: string
  gradient: string
}

const quickActions: QuickAction[] = [
  {
    path: '/gallery',
    label: '浏览图库',
    description: '查看所有已上传的图片',
    icon: '▦',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    path: '/upload',
    label: '上传图片',
    description: '批量上传新图片',
    icon: '↑',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    path: '/qrcode',
    label: '局域网访问',
    description: '在移动设备上访问图库',
    icon: '◈',
    gradient: 'from-blue-500 to-indigo-600',
  },
]

export function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <section
        className="relative overflow-hidden rounded-2xl p-8 lg:p-12 gradient-border animate-fade-in"
        style={{ animationDelay: mounted ? '0ms' : '0ms', opacity: mounted ? 0 : 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
        <div className="relative z-10">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4">
            欢迎使用
            <span className="text-gold"> Photon</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            精心打造的图片管理空间，让每一次浏览都成为艺术体验。
            <br />
            支持万张级图片的高效管理和智能搜索。
          </p>
        </div>
      </section>

      {/* 快速操作 */}
      <section>
        <h2 className="font-display text-2xl font-semibold mb-6">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={action.path}
              to={action.path}
              className="group relative overflow-hidden rounded-xl p-6 bg-card border border-border hover:border-gold/50 transition-all duration-300 image-card-hover animate-fade-in"
              style={{
                animationDelay: mounted ? `${index * 100 + 200}ms` : '0ms',
                opacity: mounted ? 0 : 1,
              }}
            >
              {/* 背景装饰 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* 内容 */}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl text-white">{action.icon}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-gold transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>

              {/* 悬停效果 */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent w-0 group-hover:w-full transition-all duration-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="animate-fade-in" style={{ animationDelay: mounted ? '500ms' : '0ms', opacity: mounted ? 0 : 1 }}>
        <h2 className="font-display text-2xl font-semibold mb-6">核心功能</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { title: '高性能处理', desc: '支持万张级图片的快速加载和浏览', icon: '⚡' },
            { title: '智能搜索', desc: '基于全文搜索的快速图片检索', icon: '🔍' },
            { title: '跨平台支持', desc: 'Windows 和 macOS 完美支持', icon: '🖥' },
            { title: '局域网访问', desc: '移动端可通过局域网访问', icon: '📱' },
            { title: '安全可靠', desc: '密码保护，数据安全有保障', icon: '🔒' },
            { title: '批量操作', desc: '支持批量上传和管理', icon: '📦' },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-gold/30 transition-all duration-300 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </span>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 统计信息 */}
      <section className="animate-fade-in" style={{ animationDelay: mounted ? '600ms' : '0ms', opacity: mounted ? 0 : 1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: '已上传图片', value: '0', unit: '张' },
            { label: '存储空间', value: '0', unit: 'MB' },
            { label: '今日上传', value: '0', unit: '张' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-card border border-border gradient-border gold-shimmer"
            >
              <div className="font-display text-3xl font-bold text-gold mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
                <span className="ml-1 text-xs">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
