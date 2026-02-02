import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface AppConfig {
  images_dir: string | null
  thumbnails_dir: string | null
  auto_generate_thumbnails: boolean
  thumbnail_max_width: number
  thumbnail_max_height: number
}

interface DirectoryInputProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onBrowse: () => void
}

function DirectoryInput({ label, value, placeholder, onChange, onBrowse }: DirectoryInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onBrowse}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          浏览...
        </button>
      </div>
    </div>
  )
}

export function Settings() {
  const [config, setConfig] = useState<AppConfig>({
    images_dir: null,
    thumbnails_dir: null,
    auto_generate_thumbnails: true,
    thumbnail_max_width: 400,
    thumbnail_max_height: 400,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [configFilePath, setConfigFilePath] = useState('')

  // 服务器管理状态
  const [serverRunning, setServerRunning] = useState(false)
  const [serverLoading, setServerLoading] = useState(false)
  const [serverMessage, setServerMessage] = useState('')

  useEffect(() => {
    loadConfig()
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    try {
      const running = await invoke<boolean>('get_server_status')
      setServerRunning(running)
    } catch (error) {
      console.error('检查服务器状态失败:', error)
    }
  }

  const handleStartServer = async () => {
    try {
      setServerLoading(true)
      setServerMessage('')
      const result = await invoke<string>('start_server')
      setServerMessage(result)
      await checkServerStatus()
      setTimeout(() => setServerMessage(''), 3000)
    } catch (error) {
      console.error('启动服务器失败:', error)
      setServerMessage('启动服务器失败')
      setTimeout(() => setServerMessage(''), 3000)
    } finally {
      setServerLoading(false)
    }
  }

  const handleStopServer = async () => {
    try {
      setServerLoading(true)
      setServerMessage('')
      const result = await invoke<string>('stop_server')
      setServerMessage(result)
      await checkServerStatus()
      setTimeout(() => setServerMessage(''), 3000)
    } catch (error) {
      console.error('停止服务器失败:', error)
      setServerMessage('停止服务器失败')
      setTimeout(() => setServerMessage(''), 3000)
    } finally {
      setServerLoading(false)
    }
  }

  const loadConfig = async () => {
    try {
      setLoading(true)
      const [loadedConfig, filePath] = await Promise.all([
        invoke<AppConfig>('get_config'),
        invoke<string>('get_config_file_path'),
      ])
      setConfig(loadedConfig)
      setConfigFilePath(filePath)
    } catch (error) {
      console.error('加载配置失败:', error)
      setMessage('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBrowseDirectory = async (type: 'images' | 'thumbnails') => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        directory: true,
        multiple: false,
      })

      if (selected && typeof selected === 'string') {
        if (type === 'images') {
          setConfig({ ...config, images_dir: selected })
        } else {
          setConfig({ ...config, thumbnails_dir: selected })
        }
      }
    } catch (error) {
      console.error('选择目录失败:', error)
      setMessage('选择目录失败')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage('')
      await invoke('update_config', { config })
      setMessage('配置保存成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('保存配置失败:', error)
      setMessage('保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      setMessage('')
      const defaultConfig: AppConfig = {
        images_dir: null,
        thumbnails_dir: null,
        auto_generate_thumbnails: true,
        thumbnail_max_width: 400,
        thumbnail_max_height: 400,
      }
      await invoke('update_config', { config: defaultConfig })
      setConfig(defaultConfig)
      setMessage('配置已重置为默认值')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('重置配置失败:', error)
      setMessage('重置配置失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">设置</h1>
        {configFilePath && (
          <div className="text-sm text-muted-foreground">
            配置文件: <code className="px-2 py-1 bg-muted rounded text-xs">
              {configFilePath}
            </code>
          </div>
        )}
      </div>

      {/* 存储设置 */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <h2 className="text-lg font-semibold">存储设置</h2>
        <p className="text-sm text-muted-foreground">
          配置图片和缩略图的存储位置。留空则使用默认位置。
        </p>

        <DirectoryInput
          label="图片存储目录"
          value={config.images_dir || ''}
          placeholder="默认: ./images"
          onChange={(value) => setConfig({ ...config, images_dir: value || null })}
          onBrowse={() => handleBrowseDirectory('images')}
        />

        <DirectoryInput
          label="缩略图目录"
          value={config.thumbnails_dir || ''}
          placeholder="默认: ./images/thumbnails"
          onChange={(value) => setConfig({ ...config, thumbnails_dir: value || null })}
          onBrowse={() => handleBrowseDirectory('thumbnails')}
        />
      </div>

      {/* API 服务器管理 */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">API 服务器</h2>
            <p className="text-xs text-muted-foreground mt-1">
              管理移动端 H5 访问的 API 服务器
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            serverRunning
              ? 'bg-green-500/10 text-green-500'
              : 'bg-muted text-muted-foreground'
          }`}>
            {serverRunning ? '运行中' : '已停止'}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStartServer}
            disabled={serverLoading || serverRunning}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {serverLoading ? '处理中...' : '启动服务器'}
          </button>
          <button
            onClick={handleStopServer}
            disabled={serverLoading || !serverRunning}
            className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {serverLoading ? '处理中...' : '停止服务器'}
          </button>
        </div>

        {serverMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            serverMessage.includes('成功') || serverMessage.includes('已停止')
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : serverMessage.includes('失败') || serverMessage.includes('占用')
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {serverMessage}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
          <p>💡 <strong>服务器说明:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>服务器启动后，移动设备可通过局域网访问应用</li>
            <li>服务器默认运行在 <code>http://0.0.0.0:3000</code></li>
            <li>关闭应用时会自动停止服务器</li>
            <li>如果端口被占用，请先停止其他占用该端口的程序</li>
          </ul>
        </div>
      </div>

      {/* 缩略图设置 */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <h2 className="text-lg font-semibold">缩略图设置</h2>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">自动生成缩略图</label>
            <p className="text-xs text-muted-foreground mt-1">
              上传图片时自动生成缩略图
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, auto_generate_thumbnails: !config.auto_generate_thumbnails })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.auto_generate_thumbnails ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.auto_generate_thumbnails ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">最大宽度</label>
            <input
              type="number"
              value={config.thumbnail_max_width}
              onChange={(e) => setConfig({ ...config, thumbnail_max_width: parseInt(e.target.value) || 400 })}
              min={100}
              max={2000}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">最大高度</label>
            <input
              type="number"
              value={config.thumbnail_max_height}
              onChange={(e) => setConfig({ ...config, thumbnail_max_height: parseInt(e.target.value) || 400 })}
              min={100}
              max={2000}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 当前目录信息 */}
      <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/50">
        <h3 className="text-sm font-semibold">当前存储位置</h3>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">图片目录:</span>
            <code className="px-2 py-0.5 bg-background rounded text-xs">
              {config.images_dir || '默认 (./images)'}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">缩略图目录:</span>
            <code className="px-2 py-0.5 bg-background rounded text-xs">
              {config.thumbnails_dir || '默认 (./images/thumbnails)'}
            </code>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          重置为默认
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('成功')
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-destructive/10 text-destructive-foreground border border-destructive/20'
        }`}>
          {message}
        </div>
      )}

      {/* 提示信息 */}
      <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/30 rounded-lg">
        <p>💡 <strong>提示:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>路径可以为相对路径（相对于项目根目录）或绝对路径</li>
          <li>留空则使用默认位置</li>
          <li>修改存储目录后，已上传的图片不会自动迁移</li>
          <li>缩略图会在上传图片时自动生成</li>
        </ul>
      </div>
    </div>
  )
}
