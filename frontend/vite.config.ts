/** ViteでReactプラグインを使い、開発サーバーを5173番ポートで起動します。 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
