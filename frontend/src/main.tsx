import { createRoot } from 'react-dom/client'
import React, { useEffect, useState } from 'react'
import App from './App.tsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from 'libs/redux'

import './i18n'

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null)

  useEffect(() => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      setHasError(true)
      setError(error)
      setErrorInfo(errorInfo)
    }

    const errorHandler = (event: ErrorEvent) => {
      handleError(new Error(event.message), {
        componentStack: event.filename + ':' + event.lineno
      })
    }

    window.addEventListener('error', errorHandler)

    return () => {
      window.removeEventListener('error', errorHandler)
    }
  }, [])

  if (hasError) {
    return (
      <div>
        <h2>Something went wrong.</h2>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {error?.toString()}
          <br />
          {errorInfo?.componentStack}
        </details>
      </div>
    )
  }

  return <>{children}</>
}

// find root element or create one with id 'root'
const container = document.getElementById('root') ?? document.createElement('div')
if (!container.parentElement || container.id !== 'root') {
  container.id = 'root'
  document.body.appendChild(container)
}
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
)
