import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.logError(error, errorInfo)
  }

  logError(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    }
    console.error('Error details:', errorData)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card border border-border rounded-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold mb-2">出现错误</h1>
              <p className="text-muted-foreground mb-6">
                应用程序遇到了意外错误
              </p>

              {this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-destructive-foreground hover:text-destructive">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded text-xs font-mono overflow-auto max-h-48">
                    <p className="font-bold mb-2">{this.state.error.message}</p>
                    <pre className="whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  重新加载
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
                >
                  返回首页
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                如果问题持续存在，请刷新页面或联系支持
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
