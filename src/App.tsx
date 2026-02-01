import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">图片管理软件</h1>
        <p className="text-muted-foreground mb-8">
          Tauri + React + TypeScript + Tailwind CSS
        </p>

        <div className="bg-card text-card-foreground rounded-lg p-6 border">
          <p className="mb-4">项目初始化成功！</p>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            点击次数: {count}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
