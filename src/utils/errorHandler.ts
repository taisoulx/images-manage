import { logger } from '@/utils/logger'

export async function invokeWithErrorHandling<T>(
  command: string,
  args?: Record<string, any>,
  errorMessage?: string
): Promise<T> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    logger.info(`Invoking command: ${command}`, args)
    const result = await invoke<T>(command, args)
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
