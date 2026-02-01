import { useState } from 'react'

export function Search() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    
    setTimeout(() => {
      setIsSearching(false)
      console.log('搜索:', query)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h1 className="text-3xl font-bold mb-6">搜索图片</h1>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-2">
              搜索关键词
            </label>
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入图片名称、标签或描述..."
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isSearching}
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </form>

        <div className="border-t border-border pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">搜索提示</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 支持中文搜索</li>
            <li>• 可以搜索文件名、标签和描述</li>
            <li>• 支持相机型号筛选</li>
            <li>• 支持GPS位置搜索</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
