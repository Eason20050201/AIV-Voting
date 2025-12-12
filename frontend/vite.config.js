import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AIV-Voting/', // Added for GitHub Pages deployment
  server: {
    port: 5173,
    strictPort: false,
  }
})
