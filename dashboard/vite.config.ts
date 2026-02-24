import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  server: {
    host: true, // Listen on all interfaces so Docker can reach it
    port: 5173,
  },
})
