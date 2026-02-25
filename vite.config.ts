import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Plugin de Tailwind debe ir antes que otros procesadores CSS
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: ''
        },
        {
          src: 'sw.js',
          dest: ''
        },
        {
          src: 'metadata.json',
          dest: ''
        }
      ]
    })
  ],
  css: {
    // El plugin de Vite de Tailwind maneja todo el procesamiento
    // No necesitamos PostCSS configurado aquí
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});