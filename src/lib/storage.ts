import localforage from 'localforage'

/**
 * Offline persistence layer built on IndexedDB (via localforage).
 *
 * - Works identically in the browser, Tauri (WebView) and Capacitor
 *   (WKWebView / Android WebView) — no server, no network.
 * - Every read/write goes to the user's device only.
 */
const driver = localforage.createInstance({
  name: 'typetester',
  storeName: 'typetester',
  description: 'TypeTester offline data',
})

const bucket = (key: string) => `tt:${key}`

export async function loadItem<T>(key: string, fallback: T): Promise<T> {
  const value = await driver.getItem<T | null>(bucket(key))
  return value ?? fallback
}

export async function saveItem<T>(key: string, value: T): Promise<void> {
  await driver.setItem(bucket(key), value)
}

export async function removeItem(key: string): Promise<void> {
  await driver.removeItem(bucket(key))
}

export async function keys(): Promise<string[]> {
  const all = await driver.keys()
  return all.filter((k) => k.startsWith('tt:')).map((k) => k.slice(3))
}

export async function clearAll(): Promise<void> {
  await driver.clear()
}

/** Whether persistence is available in the runtime environment. */
export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}