import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/NASASHE-SAS/' : '/',
  plugins: [react()],
  // Permite que Vite resuelva los paquetes que exponen la condición "tauri",
  // necesaria para los plugins oficiales de Tauri cuando la app corre en el
  // escritorio. Sin esto, el import de '@tauri-apps/plugin-dialog' falla en
  // entornos web.
  resolve: {
    conditions: ['tauri'],
  },
  build: {
    // GitHub Pages sirve el sitio desde "/NASASHE-SAS/chunk-dist".
    // Ajustamos el directorio de salida para que los assets generados
    // coincidan con las rutas absolutas que consume la página y así
    // evitar los 404 al cargar los bundles.
    outDir: 'chunk-dist',
    // Separa dependencias pesadas en chunks predecibles para reducir el tamaño
    // de los bundles principales y evitar las advertencias de Tauri/Vite.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts'
          }

          if (id.includes('firebase')) {
            return 'firebase'
          }

          if (id.includes('jspdf')) {
            return 'pdf-tools'
          }

          if (id.includes('react-router-dom')) {
            return 'router'
          }

          if (id.includes('react')) {
            return 'react'
          }

          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
