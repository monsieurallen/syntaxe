import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react()],
  base: './', // <--- Change juste '/syntaxe/' par './' pour forcer des chemins relatifs robustes
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})