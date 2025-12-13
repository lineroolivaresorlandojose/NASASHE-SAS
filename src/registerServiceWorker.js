import assetPath from './utils/assetPath'

export default function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  const swUrl = assetPath('/sw.js')

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .catch((error) => console.error('Service worker registration failed', error))
  })
}
