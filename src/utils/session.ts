
import { encrypt, decrypt, type Encryptable } from './encrypt'

export type SessionKey = 'user' | 'device' | 'settings'

export function sessionStorageSaveItem(key: SessionKey, data: Encryptable): void {
    try {
        const encrypted = encrypt(data)
        sessionStorage.setItem(key, encrypted)
    } catch (err) {
        console.error(`Failed to save session item "${key}"`, err)
    }
}

export function sessionStorageGetItem<T extends Encryptable>(
    key: SessionKey,
    validateFn?: (data: unknown) => data is T
): T | null {
    const encrypted = sessionStorage.getItem(key)
    if (!encrypted) return null

    try {
        const data = decrypt<T>(encrypted, validateFn)
        return data
    } catch (err) {
        console.error(`Failed to load session item "${key}"`, err)
        return null
    }
}

export function sessionStorageRemoveItem(key: SessionKey): void {
    sessionStorage.removeItem(key)
}

export function sessionStorageClear(): void {
    sessionStorage.clear()
}
