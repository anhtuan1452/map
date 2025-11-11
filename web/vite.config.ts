import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,  // Enable polling for file changes (Docker/WSL fix)
      interval: 300      // Check every 300ms
    },
    hmr: {
      protocol: 'wss',   // Use secure WebSocket for HTTPS domain
      host: 'fe.khoatkth-dhktdn.click',
      clientPort: 443    // HTTPS port
    },
    allowedHosts: [
      'fe.khoatkth-dhktdn.click',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward cookies and credentials
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Forward set-cookie headers back to client
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              res.setHeader('set-cookie', setCookie);
            }
          });
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})