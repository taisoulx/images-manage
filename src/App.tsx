import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'

// 加载中组件
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// 检测是否在 Tauri 环境中运行
const isTauri = () => {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

// 移动端/网页端组件 - 总是可用
const MobileHome = lazy(() => import('./pages/MobileHome').then(m => ({ default: m.MobileHome })))
const MobileGallery = lazy(() => import('./pages/MobileGallery').then(m => ({ default: m.MobileGallery })))
const MobileUpload = lazy(() => import('./pages/MobileUpload').then(m => ({ default: m.MobileUpload })))
const MobileSettings = lazy(() => import('./pages/MobileSettings').then(m => ({ default: m.MobileSettings })))

function WebApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MobileHome />} />
          <Route path="/gallery" element={<MobileGallery />} />
          <Route path="/upload" element={<MobileUpload />} />
          <Route path="/settings" element={<MobileSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  )
}

function App() {
  const [isReady, setIsReady] = useState(false)
  const [DesktopApp, setDesktopApp] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    setIsReady(true)

    // 只在 Tauri 环境中加载桌面端 App
    if (isTauri()) {
      import('./DesktopApp').then(module => {
        setDesktopApp(() => module.DesktopApp)
      })
    }

    console.log('[App] window.__TAURI__:', (window as any).__TAURI__)
    console.log('[App] isTauri:', isTauri())
  }, [])

  if (!isReady) {
    return <LoadingFallback />
  }

  // 在 Tauri 环境中，使用桌面端 App；否则使用网页端 App
  if (isTauri() && DesktopApp) {
    const Component = DesktopApp
    return <Component />
  }

  // 网页端 App
  return <WebApp />
}

export default App
