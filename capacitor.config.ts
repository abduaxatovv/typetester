import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor configuration for the Android / iOS shells.
 *
 * - webDir points at the production Vite output (`npm run build`).
 * - appendUserAgent = false keeps the WebView identical to the browser.
 * - android uses `androidScheme: https` (default) so fetch/XHR, blob URLs
 *   and localforage (IndexedDB) all behave like a normal web app.
 */
const config: CapacitorConfig = {
  appId: 'com.typetester.app',
  appName: 'TypeTester',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0c1119',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0c1119',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#0c1119',
    },
  },
}

export default config