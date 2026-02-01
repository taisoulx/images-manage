import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Gallery } from '@/pages/Gallery'
import { Search } from '@/pages/Search'
import { Upload } from '@/pages/Upload'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Home /></Layout>,
  },
  {
    path: '/gallery',
    element: <Layout><Gallery /></Layout>,
  },
  {
    path: '/search',
    element: <Layout><Search /></Layout>,
  },
  {
    path: '/upload',
    element: <Layout><Upload /></Layout>,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
