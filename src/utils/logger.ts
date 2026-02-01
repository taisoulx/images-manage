export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  context?: Record<string, any>
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 100

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorContext = error instanceof Error
      ? { ...context, error: { message: error.message, stack: error.stack } }
      : context
    this.log('error', message, errorContext)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    this.outputToConsole(entry)
  }

  private outputToConsole(entry: LogEntry) {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case 'error':
        console.error(message, entry.context || '')
        break
      case 'warn':
        console.warn(message, entry.context || '')
        break
      case 'info':
        console.info(message, entry.context || '')
        break
      case 'debug':
        console.debug(message, entry.context || '')
        break
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
