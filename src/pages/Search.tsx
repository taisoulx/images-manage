import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { ImageCard } from '@/components/ImageCard'
import { invokeWithErrorHandling } from '@/utils/errorHandler'

export function Search() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [displayedResults, setDisplayedResults] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const RESULTS_PER_PAGE = 20
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setPage(1)

    try {
      const searchResults = await invokeWithErrorHandling<any[]>('search_images', {
        query: query,
      })
      setResults(searchResults)
      setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
      setHasMore(searchResults.length > RESULTS_PER_PAGE)
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
      setDisplayedResults([])
      setHasMore(false)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (inView && hasMore) {
      setPage((prevPage) => prevPage + 1)
    }
  }, [inView, hasMore])

  useEffect(() => {
    const start = (page - 1) * RESULTS_PER_PAGE
    const end = start + RESULTS_PER_PAGE
    const newResults = results.slice(0, end)
    setDisplayedResults(newResults)
    setHasMore(end < results.length)
  }, [page, results])

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

        {displayedResults.length > 0 && (
          <div className="border-t border-border pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">
              搜索结果 ({results.length} 条，已显示 {displayedResults.length} 条)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedResults.map((result: any, index) => (
                <ImageCard
                  key={result.id || index}
                  image={result}
                />
              ))}
              {hasMore && (
                <div ref={ref} className="col-span-full flex justify-center py-8">
                  <div className="text-muted-foreground">加载更多...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isSearching && query && displayedResults.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            没有找到匹配的图片
          </div>
        )}
      </div>
    </div>
  )
}
