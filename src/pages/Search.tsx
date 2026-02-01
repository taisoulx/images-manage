import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

export function Search() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    try {
      const searchResults = await invoke<any[]>('search_images', {
        query: query,
      })
      setResults(searchResults)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">搜索图片</h1>

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

        {results.length > 0 && (
          <div className="border-t border-border pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">
              搜索结果 ({results.length} 条)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result: any, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted rounded-md border border-border hover:border-primary transition-colors"
                >
                  <div className="aspect-square bg-background rounded mb-3 flex items-center justify-center">
                    {result.thumbnail_path ? (
                      <img
                        src={result.thumbnail_path}
                        alt={result.filename}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-4xl">📷</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{result.filename}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(Number(result.size) / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
