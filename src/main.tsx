import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './components/Router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logger } from './utils/logger'
import './styles/globals.css'

logger.info('Application starting')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>,
)
