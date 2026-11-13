import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react()],
  base: '/syntaxe/',
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})