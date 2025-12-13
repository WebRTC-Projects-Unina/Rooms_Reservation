import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      // certificati che abbiamo creato nel backend
      key: fs.readFileSync(path.resolve(__dirname, '../backend/certs/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/certs/server.cert')),
    },
    // il proxy fa da intermediario tra le richieste del frontend e del backend
    // altrimenti i cookie di sessione verrebbero bloccati dai browser moderni 
    // per le politiche di sicurezza "Third-Party Cookies".
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        secure: false,  // accetta certificati self-signed del backend
        changeOrigin: true
      },
      '/auth': {
        target: 'https://localhost:3000',
        secure: false,
        changeOrigin: true
      }
    }
  }
})