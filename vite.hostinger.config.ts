import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Subdominio dedicado: https://procesos.viajescasal.com/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist-hostinger' },
});
