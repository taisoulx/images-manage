import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Gallery } from '@/pages/Gallery'
import { Search } from '@/pages/Search'
import { Upload } from '@/pages/Upload'
import { Login } from '@/pages/Login'
import { QrCode } from '@/pages/QrCode'

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
        path: '/qrcode',
        element: <QrCode />
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
