import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface NetworkInfo {
  ipAddress: string
  port: number
  url: string
  allAddresses?: string[]
  hostname?: string
}

export function QrCode() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkServerStatus()
    const interval = setInterval(checkServerStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/health')
      setServerRunning(response.ok)
      if (response.ok) {
        await fetchNetworkInfo()
      }
    } catch (err) {
      setServerRunning(false)
    }
  }

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/network')
      if (!response.ok) {
        throw new Error('获取网络信息失败')
      }
      const data = await response.json()
      setNetworkInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const startServer = async () => {
    try {
      // 使用 Tauri 命令启动服务器
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('start_server')
      // 等待服务器启动
      setTimeout(() => {
        checkServerStatus()
      }, 2000)
    } catch (err) {
      console.error('启动服务器失败:', err)
      alert('启动服务器失败，请手动运行 npm run server')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0ms', opacity: mounted ? 0 : 1 }}>
        <div>
          <h1 className="font-display text-3xl font-bold">局域网访问</h1>
          <p className="text-sm text-muted-foreground mt-1">
            扫描二维码，在移动设备上访问图片管理系统
          </p>
        </div>

        {/* 服务器状态 */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${serverRunning ? 'bg-green-500' : 'bg-destructive'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">
            {serverRunning ? '服务运行中' : '服务未启动'}
          </span>
        </div>
      </div>

      {/* 服务器未运行提示 */}
      {!serverRunning && (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in" style={{ animationDelay: '100ms', opacity: mounted ? 0 : 1 }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-destructive-foreground mb-2">服务器未启动</h3>
              <p className="text-sm text-destructive-foreground mb-4">
                需要先启动 API 服务器才能使用网页端访问功能
              </p>
              <button
                onClick={startServer}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                启动服务器
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '100ms', opacity: mounted ? 0 : 1 }}>
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">正在获取网络信息...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive-foreground border border-destructive/20 animate-fade-in" style={{ animationDelay: '100ms', opacity: mounted ? 0 : 1 }}>
          <div className="flex items-center gap-3">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 二维码和网络信息 */}
      {networkInfo && serverRunning && (
        <div className="animate-fade-in" style={{ animationDelay: '200ms', opacity: mounted ? 0 : 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 二维码 */}
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border gradient-border">
              <div className="bg-white p-6 rounded-xl shadow-2xl">
                <QRCodeSVG
                  value={networkInfo.url}
                  size={280}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                使用手机扫描二维码
              </p>
            </div>

            {/* 访问信息 */}
            <div className="space-y-4">
              {/* 主要访问地址 */}
              <div className="p-4 rounded-lg bg-card border border-border">
                <label className="text-sm text-muted-foreground mb-2">访问地址</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm font-mono break-all text-gold">
                    {networkInfo.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(networkInfo.url)}
                    className="px-3 py-2 bg-gold text-background rounded-lg hover:bg-gold/90 transition-colors"
                    title="复制"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* IP 地址 */}
              <div className="p-4 rounded-lg bg-card border border-border">
                <label className="text-sm text-muted-foreground mb-2">本机 IP 地址</label>
                <p className="text-xl font-semibold text-gold">{networkInfo.ipAddress}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  端口: {networkInfo.port}
                </p>
              </div>

              {/* 主机名 */}
              {networkInfo.hostname && (
                <div className="p-4 rounded-lg bg-card border border-border">
                  <label className="text-sm text-muted-foreground mb-2">主机名</label>
                  <p className="font-semibold">{networkInfo.hostname}</p>
                </div>
              )}

              {/* 其他可用地址 */}
              {networkInfo.allAddresses && networkInfo.allAddresses.length > 0 && (
                <div className="p-4 rounded-lg bg-card border border-border">
                  <label className="text-sm text-muted-foreground mb-2">其他可用地址</label>
                  <div className="space-y-2">
                    {networkInfo.allAddresses.map((addr, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                        <code className="text-xs font-mono">{addr}</code>
                        <button
                          onClick={() => copyToClipboard(`http://${addr}:${networkInfo.port}`)}
                          className="text-xs px-2 py-1 bg-gold text-background rounded hover:bg-gold/90 transition-colors"
                        >
                          复制
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="p-6 rounded-xl bg-card border border-border animate-fade-in" style={{ animationDelay: '300ms', opacity: mounted ? 0 : 1 }}>
        <h2 className="font-display text-xl font-semibold mb-4">使用流程</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '📱', title: '扫描二维码', desc: '使用手机相机扫描上方二维码' },
            { icon: '🌐', title: '打开链接', desc: '在手机浏览器中自动打开访问地址' },
            { icon: '🔑', title: '登录系统', desc: '首次访问需要登录（默认密码: admin）' },
            { icon: '📷', title: '浏览图片', desc: '可以在移动端浏览、搜索、上传图片' },
          ].map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-all"
            >
              <span className="text-3xl mb-2">{step.icon}</span>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 注意事项 */}
      <div className="p-6 rounded-xl bg-muted/30 border border-border animate-fade-in" style={{ animationDelay: '400ms', opacity: mounted ? 0 : 1 }}>
        <h2 className="font-display text-lg font-semibold mb-4">注意事项</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>确保手机和电脑连接到同一 Wi-Fi 网络</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>IP 地址可能随网络环境变化，需要重新获取二维码</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>请确保防火墙允许端口 3000 的访问</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>建议在受信任的网络环境下使用</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>移动端可进行完整的图片管理操作</span>
          </li>
        </ul>
      </div>

      {/* 快速复制 */}
      {networkInfo && (
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '500ms', opacity: mounted ? 0 : 1 }}>
          <button
            onClick={() => copyToClipboard(networkInfo.url)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-background font-semibold rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
          >
            复制访问地址
          </button>
          <button
            onClick={() => {
              const shareData = {
                title: 'Photon 图片管理',
                text: `扫描二维码或访问: ${networkInfo.url}`,
                url: networkInfo.url
              }
              if (navigator.share) {
                navigator.share(shareData)
              } else {
                copyToClipboard(networkInfo.url)
              }
            }}
            className="flex-1 px-6 py-3 bg-card border border-border rounded-lg hover:border-gold/50 transition-colors"
          >
            分享链接
          </button>
        </div>
      )}
    </div>
  )
}
