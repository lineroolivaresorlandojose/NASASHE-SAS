import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Permite que Vite resuelva los paquetes que exponen la condición "tauri",
  // necesaria para los plugins oficiales de Tauri cuando la app corre en el
  // escritorio. Sin esto, el import de '@tauri-apps/plugin-dialog' falla en
  // entornos web.
  resolve: {
    conditions: ['tauri'],
  },  
})
