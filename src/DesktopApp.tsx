import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Gallery = lazy(() => import('./pages/Gallery').then(m => ({ default: m.Gallery })))
const Upload = lazy(() => import('./pages/Upload').then(m => ({ default: m.Upload })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const QrCode = lazy(() => import('./pages/QrCode').then(m => ({ default: m.QrCode })))

export function DesktopApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="upload" element={<Upload />} />
            <Route path="settings" element={<Settings />} />
            <Route path="qrcode" element={<QrCode />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  )
}
