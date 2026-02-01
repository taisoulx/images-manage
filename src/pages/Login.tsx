import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

export function Login() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await invoke<{ token: string }>('login', { password })
      localStorage.setItem('token', result.token)
      alert('登录成功！')
      setPassword('')
    } catch (err: any) {
      setError(err.message || '登录失败，请检查密码')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-card rounded-lg border border-border p-6">
        <h1 className="text-3xl font-bold mb-6">登录</h1>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive-foreground rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              管理员密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码..."
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="border-t border-border pt-6 mt-6">
          <p className="text-sm text-muted-foreground">
            默认密码: admin
          </p>
        </div>
      </div>
    </div>
  )
}
