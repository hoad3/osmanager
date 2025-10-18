import { defineConfig,type ConfigEnv, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

export default ({ mode }: ConfigEnv) => {
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir)
  const apiUrl = env.VITE_API_URL || env.API_URL || 'http://localhost:5295'

  return defineConfig({
    envDir,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  })
}