import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react()],
  base: '/syntaxe/', // <--- C'est cette ligne magique qui manquait pour pointer vers le bon dossier sur GitHub Pages
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})