import { logger } from '@/utils/logger'

let invokeCache: ((command: string, args?: Record<string, any>) => Promise<any>) | null = null
let isTauriEnvironment = false

async function getInvoke() {
  if (invokeCache) {
    return invokeCache
  }

  try {
    const tauriCore = await import('@tauri-apps/api/core')

    logger.info('Tauri core module imported', Object.keys(tauriCore))

    if (tauriCore.invoke) {
      invokeCache = tauriCore.invoke
      isTauriEnvironment = true
      logger.info('Tauri invoke API is available')
    } else if ((tauriCore as any).default && (tauriCore as any).default.invoke) {
      invokeCache = (tauriCore as any).default.invoke
      isTauriEnvironment = true
      logger.info('Tauri invoke API found in default export')
    } else {
      logger.error('Tauri invoke API not found', {
        hasInvoke: !!tauriCore.invoke,
        hasDefault: !!(tauriCore as any).default,
        keys: Object.keys(tauriCore)
      })
    }

    return invokeCache
  } catch (error) {
    logger.error('Failed to import Tauri core API', error)
    throw new Error('Tauri API is not available. Make sure app is running in Tauri environment.')
  }
}

export async function invokeWithErrorHandling<T>(
  command: string,
  args?: Record<string, any>,
  errorMessage?: string
): Promise<T> {
  try {
    const invoke = await getInvoke()

    if (!invoke) {
      throw new Error('Tauri invoke API is not available. Make sure app is running in Tauri environment.')
    }

    logger.info(`Invoking command: ${command}`, args)
    const result = await invoke(command, args) as T
    logger.info(`Command ${command} succeeded`)
    return result
  } catch (error) {
    logger.error(
      errorMessage || `Failed to invoke command: ${command}`,
      error,
      { command, args }
    )
    throw error
  }
}

export function isRunningInTauri(): boolean {
  return isTauriEnvironment
}

export function handleAsyncError(
  error: unknown,
  defaultMessage: string = '操作失败'
): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return defaultMessage
}

export function logAndThrow(error: Error | unknown, message: string): never {
  logger.error(message, error)
  throw error
}

export function safeExecute<T>(
  fn: () => T,
  fallback?: T,
  context?: string
): T | undefined {
  try {
    return fn()
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}`, error)
    } else {
      logger.error('Error during execution', error)
    }
    return fallback
  }
}

export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}`, error)
    } else {
      logger.error('Error during async execution', error)
    }
    return fallback
  }
}
