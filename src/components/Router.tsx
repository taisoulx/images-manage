import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Gallery } from '@/pages/Gallery'
import { Search } from '@/pages/Search'
import { Upload } from '@/pages/Upload'
import { Login } from '@/pages/Login'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: '/gallery',
        element: <Gallery />
      },
      {
        path: '/search',
        element: <Search />
      },
      {
        path: '/upload',
        element: <Upload />
      },
      {
        path: '/login',
        element: <Login />
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
