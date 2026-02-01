import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface NetworkInfo {
  ipAddress: string
  port: number
  url: string
}

export function QrCode() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch('/api/network')
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

    fetchNetworkInfo()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">二维码访问</h1>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            加载中...
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive-foreground p-4 rounded-md">
            {error}
          </div>
        ) : networkInfo ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCodeSVG
                  value={networkInfo.url}
                  size={256}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="text-center sm:text-left space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">IP 地址</p>
                  <p className="text-lg font-semibold">{networkInfo.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">端口</p>
                  <p className="text-lg font-semibold">{networkInfo.port}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">访问地址</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {networkInfo.url}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">使用说明</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>1. 确保手机和电脑在同一局域网内</li>
                <li>2. 使用手机扫描上方二维码</li>
                <li>3. 在手机浏览器中打开链接访问图片管理系统</li>
                <li>4. 首次访问需要登录（默认密码: admin）</li>
              </ul>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">注意事项</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 局域网访问仅在设备连接到同一网络时可用</li>
                <li>• IP 地址可能会随网络变化而改变</li>
                <li>• 请确保防火墙允许端口 {networkInfo.port} 的访问</li>
                <li>• 建议在受信任的网络环境下使用</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
