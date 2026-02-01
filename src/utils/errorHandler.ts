import { logger } from '@/utils/logger'

async function getInvoke() {
  try {
    console.log('[getInvoke] Checking window.__TAURI__...')
    console.log('[getInvoke] window.__TAURI__ exists:', !!(window as any).__TAURI__)

    if ((window as any).__TAURI__) {
      const tauri = (window as any).__TAURI__
      console.log('[getInvoke] Tauri object found, keys:', Object.keys(tauri))

      if (tauri.core && tauri.core.invoke && typeof tauri.core.invoke === 'function') {
        console.log('[getInvoke] Using window.__TAURI__.core.invoke')
        return tauri.core.invoke
      }

      if (tauri.invoke && typeof tauri.invoke === 'function') {
        console.log('[getInvoke] Using window.__TAURI__.invoke')
        return tauri.invoke
      }
    }

    console.log('[getInvoke] Trying module import...')
    const tauriCore = await import('@tauri-apps/api/core')

    console.log('[getInvoke] Module import result:', {
      keys: Object.keys(tauriCore),
      hasInvoke: 'invoke' in tauriCore,
      invokeType: typeof tauriCore.invoke,
      hasDefault: 'default' in tauriCore,
      defaultType: typeof (tauriCore as any).default
    })

    if (tauriCore.invoke && typeof tauriCore.invoke === 'function') {
      console.log('[getInvoke] Using tauriCore.invoke')
      return tauriCore.invoke
    }

    if ((tauriCore as any).default && typeof (tauriCore as any).default.invoke === 'function') {
      console.log('[getInvoke] Using tauriCore.default.invoke')
      return (tauriCore as any).default.invoke
    }

    throw new Error('No valid invoke function found')
  } catch (error) {
    console.error('[getInvoke] Failed to get Tauri invoke function', error)
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

    if (!invoke || typeof invoke !== 'function') {
      throw new Error('Tauri invoke API is not available. invoke is: ' + String(invoke))
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
  return !!(window as any).__TAURI__
}
