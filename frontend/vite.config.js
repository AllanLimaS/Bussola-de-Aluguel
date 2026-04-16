import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expõe na rede local
    proxy: {
      // Redireciona /api/* → http://localhost:8000/*
      // Assim o frontend nunca precisa saber o IP do backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Também faz proxy das fotos estáticas do backend
      '/fotos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
