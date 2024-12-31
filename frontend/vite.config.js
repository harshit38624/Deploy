import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    server: {
      host: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000", // Backend server
        changeOrigin: true,
      },
    },
  },
});
